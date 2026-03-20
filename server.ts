import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Firebase config
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(__dirname, "firebase-applet-config.json"), "utf8"));
const app_firebase = initializeApp(firebaseConfig);
const db = getFirestore(app_firebase, firebaseConfig.firestoreDatabaseId);

const PORT = 3000;

async function fetchBinanceHistory(symbol: string, limit: number = 4320) {
  const klines: any[] = [];
  let endTime: number | undefined = undefined;
  
  // Binance limit is 1000 per request. We need ~5 requests for 4320 points.
  while (klines.length < limit) {
    const currentLimit = Math.min(1000, limit - klines.length);
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=${currentLimit}${endTime ? `&endTime=${endTime}` : ""}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data || data.length === 0) break;
    
    // Binance returns oldest to newest. We want to prepend to our list.
    const formatted = data.map((d: any) => ({
      time: d[0] / 1000,
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4]),
    }));
    
    klines.unshift(...formatted);
    endTime = data[0][0] - 1; // Set endTime to just before the oldest candle fetched
    
    if (data.length < currentLimit) break;
  }
  
  // Sort by time just in case
  return klines.sort((a, b) => a.time - b.time);
}

async function startServer() {
  const app = express();

  // API routes
  app.get("/api/history/:symbol", async (req, res) => {
    const { symbol } = req.params;
    const docRef = doc(db, "klines", symbol);
    
    try {
      const docSnap = await getDoc(docRef);
      const now = Date.now();
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        // If data is less than 5 minutes old, return it
        if (now - data.lastUpdated < 5 * 60 * 1000) {
          return res.json(data.klines);
        }
      }
      
      // Fetch new data
      console.log(`Fetching 3 days of history for ${symbol} from Binance...`);
      const klines = await fetchBinanceHistory(symbol);
      
      // Cache in Firestore
      await setDoc(docRef, {
        symbol,
        klines,
        lastUpdated: now
      });
      
      res.json(klines);
    } catch (error) {
      console.error("Error fetching history:", error);
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
