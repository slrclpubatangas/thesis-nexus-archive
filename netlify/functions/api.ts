import express from "express";
import serverless from "serverless-http";
// IMPORTANT: MemStorage is for development and will not persist data
// across different requests or deployments on Netlify. You should
// implement a proper database connection for production.
import { storage } from "../../server/storage";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- Add your API routes here ---
// The routes you define here will be accessible under /api/...
// For example, a route app.get('/users', ...) will be available at /api/users

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from your serverless API!" });
});

// Example route using the storage interface
app.get("/api/user/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }
  const user = await storage.getUser(id);
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: "User not found" });
  }
});

// This exports the handler for Netlify to use.
export const handler = serverless(app);
