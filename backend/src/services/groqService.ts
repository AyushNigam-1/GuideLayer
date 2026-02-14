import { ChatGroq } from "@langchain/groq";
import {
    BaseMessage,
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages";

// initialize once
const llm = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    apiKey: process.env.GROQ_API_KEY!,
});

type IncomingMessage = {
    role: "user" | "system";
    content: string;
};

export const generateChat = async (messages: IncomingMessage[]) => {
    try {
        // convert raw messages → LangChain messages
        const lcMessages: BaseMessage[] = messages.map((m) => {
            if (m.role === "system") return new SystemMessage(m.content);
            return new HumanMessage(m.content);
        });

        const response = await llm.invoke(lcMessages);

        // response is AIMessage
        return response.content;
    } catch (error) {
        throw error;
    }
};
