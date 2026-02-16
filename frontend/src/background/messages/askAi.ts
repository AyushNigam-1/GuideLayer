import type { PlasmoMessaging } from "@plasmohq/messaging"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    const { message } = req.body

    try {
        const response = await fetch("http://localhost:4000/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: [{ role: "user", content: message }]
            })
        })

        const data = await response.json()

        // Send the result back to the frontend
        res.send({
            result: data.result,
            error: null
        })

    } catch (error) {
        console.error("Background fetch error:", error)
        res.send({
            result: null,
            error: "Failed to reach backend"
        })
    }
}

export default handler