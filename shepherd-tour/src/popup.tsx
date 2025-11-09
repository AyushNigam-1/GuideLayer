import { useState } from "react"
import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://chatgpt.com/*"]  // Optional: Only show popup on ChatGPT
}

export default function Popup() {
  const [status, setStatus] = useState("")
  const [isDisabled, setIsDisabled] = useState(false)
  const [buttonText, setButtonText] = useState("Start Tour")

  const handleStartTour = async () => {
    setIsDisabled(true)
    setStatus("Checking tab...")

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

      if (!tab.url || !tab.url.startsWith("https://chatgpt.com/")) {
        setStatus("Please open ChatGPT.com first!")
        setIsDisabled(false)
        return
      }

      setStatus("Injecting tour...")

      const response = await chrome.runtime.sendMessage({ action: "startTour" })

      if (response?.success) {
        setStatus("Tour started! 🎉")
        setButtonText("Tour Active")
        setIsDisabled(true)
        // Optional: Clear status after 3s
        setTimeout(() => setStatus(""), 3000)
      } else {
        setStatus(response?.error || "Failed to start tour. Check console.")
        setIsDisabled(false)
      }
    } catch (error) {
      setStatus("Error: " + (error as Error).message)
      setIsDisabled(false)
    }
  }

  return (
    <div
      style={{
        width: "200px",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        textAlign: "center"
      }}
    >
      <h3>Shepherd Tour</h3>
      <p>Start the ChatGPT tour?</p>
      <button
        onClick={handleStartTour}
        disabled={isDisabled}
        style={{
          width: "100%",
          padding: "10px",
          background: isDisabled ? "#ccc" : "#10a37f",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: isDisabled ? "not-allowed" : "pointer"
        }}
        onMouseOver={(e) =>
          !isDisabled && (e.currentTarget.style.background = "#0d8b68")
        }
        onMouseOut={(e) =>
          !isDisabled && (e.currentTarget.style.background = "#10a37f")
        }
      >
        {buttonText}
      </button>
      {status && (
        <div
          style={{
            marginTop: "10px",
            fontSize: "12px",
            color: "#666"
          }}
        >
          {status}
        </div>
      )}
    </div>
  )
}