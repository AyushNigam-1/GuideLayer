import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import llmRoutes from "./routes/llmRoutes";
import vectorRoutes from "./routes/vectorRoutes";
import { errorHandler } from "./middleware/errorHanlder";
import { auth } from "./auth";

const app = express();

app.use(
    cors({
        origin: ["chrome-extension://ibmlpgeggepeaaiincekmiojeljnacei"],
        credentials: true,
    })
);

app.get("/auth-success", (req, res) => {
    res.send(`
        <html>
            <body style="display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif; background-color:#0f172a; color:white; text-align:center;">
                <div>
                    <h2 style="color:#22c55e;">Login Successful!</h2>
                    <p>You are now authenticated. You can safely close this tab and return to the GuideLayer extension.</p>
                </div>
                <script>
                    // Attempt to auto-close the tab 
                    setTimeout(() => { window.close(); }, 1500);
                </script>
            </body>
        </html>
    `);
});

app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());

app.use("/api", llmRoutes);
app.use("/api", vectorRoutes);

app.use(errorHandler);

export default app;
