import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Lazy initialization helper for GoogleGenAI
let ai: GoogleGenAI | null = null;

function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!ai) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
}

function calculateLocalAnswer(question: string, contextData: any): string {
  const q = question.toLowerCase();
  
  // Extract data arrays safely
  const brokers = Array.isArray(contextData?.brokers) ? contextData.brokers : [];
  const projects = Array.isArray(contextData?.projects) ? contextData.projects : [];
  const properties = Array.isArray(contextData?.properties) ? contextData.properties : [];
  const sales = Array.isArray(contextData?.sales) ? contextData.sales : [];
  const commissions = Array.isArray(contextData?.commissions) ? contextData.commissions : [];
  const payments = Array.isArray(contextData?.payments) ? contextData.payments : [];

  // Helper for Indian Rupee format
  const formatRupee = (val: number) => {
    return "₹" + val.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  // Calculations
  const totalSalesVal = sales.reduce((sum: number, s: any) => sum + (Number(s.sale_amount) || 0), 0);
  const totalNetComm = commissions.reduce((sum: number, c: any) => sum + (Number(c.net_commission) || 0), 0);
  const totalPaidComm = commissions.reduce((sum: number, c: any) => sum + (Number(c.paid_amount) || 0), 0);
  const totalPendingComm = commissions.reduce((sum: number, c: any) => sum + (Number(c.pending_amount) || 0), 0);

  // Group by Broker
  const brokerMap: Record<string, { name: string; paid: number; pending: number; net: number; salesCount: number }> = {};
  brokers.forEach((b: any) => {
    brokerMap[b.id] = { name: b.name, paid: 0, pending: 0, net: 0, salesCount: 0 };
  });

  commissions.forEach((c: any) => {
    const bid = c.broker_id;
    if (!brokerMap[bid]) {
      const brkObj = brokers.find((b: any) => b.id === bid);
      brokerMap[bid] = { name: brkObj?.name || `Broker ${bid}`, paid: 0, pending: 0, net: 0, salesCount: 0 };
    }
    brokerMap[bid].paid += Number(c.paid_amount) || 0;
    brokerMap[bid].pending += Number(c.pending_amount) || 0;
    brokerMap[bid].net += Number(c.net_commission) || 0;
  });

  sales.forEach((s: any) => {
    const bid = s.broker_id;
    if (brokerMap[bid]) {
      brokerMap[bid].salesCount += 1;
    }
  });

  const brokerList = Object.values(brokerMap);

  // Group by Project
  const projectMap: Record<string, { name: string; totalComm: number; salesCount: number }> = {};
  
  commissions.forEach((c: any) => {
    const saleObj = sales.find((s: any) => s.id === c.sale_id);
    if (saleObj) {
      const projName = saleObj.project_name || 'Unknown Project';
      const pKey = projName.toLowerCase();
      if (!projectMap[pKey]) {
        projectMap[pKey] = { name: projName, totalComm: 0, salesCount: 0 };
      }
      projectMap[pKey].totalComm += Number(c.net_commission) || 0;
    }
  });

  sales.forEach((s: any) => {
    const projName = s.project_name || 'Unknown Project';
    const pKey = projName.toLowerCase();
    if (!projectMap[pKey]) {
      projectMap[pKey] = { name: projName, totalComm: 0, salesCount: 0 };
    }
    projectMap[pKey].salesCount += 1;
  });

  const projectList = Object.values(projectMap);

  // Rankings
  const sortedBrokers = [...brokerList].sort((a, b) => b.net - a.net);
  const topBroker = sortedBrokers[0];

  const sortedProjects = [...projectList].sort((a, b) => b.totalComm - a.totalComm);
  const topProject = sortedProjects[0];

  // Match Query Patterns

  // 1. Pending Commission queries
  if (q.includes("pending") || q.includes("outstanding") || q.includes("yet to pay") || q.includes("due")) {
    const namedBroker = brokers.find((b: any) => q.includes(b.name.toLowerCase()));
    if (namedBroker) {
      const stats = brokerMap[namedBroker.id];
      const pendingVal = stats ? stats.pending : 0;
      return `**Pending commission for ${namedBroker.name}:**\n\n` +
             `- Outstanding Payout: **${formatRupee(pendingVal)}**\n` +
             `- Already Paid: **${formatRupee(stats ? stats.paid : 0)}**\n` +
             `- Total Commission Earned: **${formatRupee(stats ? stats.net : 0)}**\n\n` +
             `*You can process payouts or check transactions under the Reports navigation tab.*`;
    }
    return `**Outstanding Commission Summary:**\n\n` +
           `- There is currently **${formatRupee(totalPendingComm)}** in pending broker payouts across all sales.\n` +
           `- Total Net Commission: **${formatRupee(totalNetComm)}**\n` +
           `- Total Paid Out: **${formatRupee(totalPaidComm)}**\n\n` +
           `Use the **Ledger & Reports** screen to disburse these pending balances.`;
  }

  // 2. Totals / Summaries
  if (q.includes("total commission") || q.includes("earned so far") || q.includes("how much is total") || q.includes("total paid") || q.includes("this month")) {
    if (q.includes("paid")) {
      return `**Total Disbursed Commission:**\n\n` +
             `- Total Paid out: **${formatRupee(totalPaidComm)}**\n` +
             `- Remaining Pending: **${formatRupee(totalPendingComm)}**`;
    }
    return `**SyncAI Commission Overview:**\n\n` +
           `- Total Commissions Generated: **${formatRupee(totalNetComm)}**\n` +
           `- Total Paid Out to date: **${formatRupee(totalPaidComm)}**\n` +
           `- Outstanding Balance (Pending): **${formatRupee(totalPendingComm)}**\n\n` +
           `This corresponds to a total sales turnover of **${formatRupee(totalSalesVal)}** from **${sales.length}** bookings.`;
  }

  // 3. Broker Performance / Specific Broker Earning
  const matchedBroker = brokers.find((b: any) => q.includes(b.name.toLowerCase()));
  if (matchedBroker) {
    const stats = brokerMap[matchedBroker.id];
    return `**Earnings Statement for ${matchedBroker.name}:**\n\n` +
           `- Total Commission: **${formatRupee(stats ? stats.net : 0)}**\n` +
           `- Total Disbursed: **${formatRupee(stats ? stats.paid : 0)}**\n` +
           `- Total Outstanding: **${formatRupee(stats ? stats.pending : 0)}**\n` +
           `- Active Sales Logged: **${stats ? stats.salesCount : 0} sales**\n\n` +
           `Contact Details: **${matchedBroker.mobile || 'N/A'}** • GST Registered: **${matchedBroker.gst_number || 'No'}**`;
  }

  if (q.includes("top earning broker") || q.includes("top broker") || q.includes("highest earning") || q.includes("best broker") || q.includes("broker ranking")) {
    if (topBroker && topBroker.net > 0) {
      let response = `**Broker Earnings Leaderboard:**\n\n`;
      const top5 = sortedBrokers.slice(0, 5);
      top5.forEach((b, idx) => {
        response += `${idx + 1}. **${b.name}**: **${formatRupee(b.net)}** earned (${b.salesCount} bookings)\n`;
      });
      if (sortedBrokers.length > 5) {
        response += `\n*...and ${sortedBrokers.length - 5} other brokers in our records. Check the Reports screen for the full leaderboard.*`;
      }
      return response;
    }
    return `No brokers have earned commission yet because no sales have been recorded.`;
  }

  // 4. Project Specific commission
  const matchedProj = projects.find((p: any) => q.includes(p.name.toLowerCase()));
  if (matchedProj) {
    const stats = projectList.find(p => p.name.toLowerCase() === matchedProj.name.toLowerCase());
    const commVal = stats ? stats.totalComm : 0;
    const salesCount = stats ? stats.salesCount : 0;
    return `**Project Performance: ${matchedProj.name}**\n\n` +
           `- Accumulated Commission: **${formatRupee(commVal)}**\n` +
           `- Total Booked Sales: **${salesCount} transactions**\n` +
           `- Location: **${matchedProj.area || 'Main Area'}, ${matchedProj.city || 'Pune'}**`;
  }

  if (q.includes("project generated most") || q.includes("top project") || q.includes("highest project") || q.includes("best project")) {
    if (topProject && topProject.totalComm > 0) {
      let response = `**Project Commission Rankings:**\n\n`;
      const top5 = sortedProjects.slice(0, 5);
      top5.forEach((p, idx) => {
        response += `${idx + 1}. **${p.name}**: **${formatRupee(p.totalComm)}** commission generated (${p.salesCount} bookings)\n`;
      });
      if (sortedProjects.length > 5) {
        response += `\n*...and ${sortedProjects.length - 5} more projects registered. See Properties tab for inventory.*`;
      }
      return response;
    }
    return `No sales or commissions have been calculated for projects yet.`;
  }

  // 5. Flat / Unit details
  if (q.includes("flat") || q.includes("unit") || q.includes("sale on")) {
    const matchedSale = sales.find((s: any) => {
      const fNum = String(s.flat_number || '').toLowerCase();
      return fNum && q.includes(fNum);
    });

    if (matchedSale) {
      return `**Sale transaction detail for Flat ${matchedSale.flat_number}:**\n\n` +
             `- Project: **${matchedSale.project_name}**\n` +
             `- Total Sale Value: **${formatRupee(matchedSale.sale_amount)}**\n` +
             `- Net Commission: **${formatRupee(matchedSale.net_commission)}**\n` +
             `- Broker: **${matchedSale.broker_name || 'Direct Sale'}**\n` +
             `- TDS Deducted: **${formatRupee(matchedSale.tds_amount || 0)}** • GST Paid: **${formatRupee(matchedSale.gst_amount || 0)}**\n` +
             `- Sale Booking Date: **${new Date(matchedSale.booking_date).toLocaleDateString()}**`;
    }
  }

  // 6. "How are we doing?" / "how're we doing?" / general status
  if (q.includes("how are we doing") || q.includes("how is we doing") || q.includes("performance") || q.includes("business") || q.includes("status")) {
    return `**SyncAI Consultancy Business Performance:**\n\n` +
           `- Overall Sales Volume: **${formatRupee(totalSalesVal)}**\n` +
           `- Total Net Commission: **${formatRupee(totalNetComm)}**\n` +
           `- Paid Out to Brokers: **${formatRupee(totalPaidComm)}**\n` +
           `- Pending Balance: **${formatRupee(totalPendingComm)}**\n` +
           `- Registered Brokers: **${brokers.length} active**\n\n` +
           `Our business matches are healthy and active! Feel free to ask more details about top-ranking projects or individual broker balances.`;
  }

  // 7. Unrelated or default
  return `I only know about the commission, sale, and broker data inside this app.\n\n` +
         `Please ask me about:\n` +
         `- **Totals**: *"What is our total commission?"* or *"How much is pending?"*\n` +
         `- **Brokers**: *"How much has [Broker Name] earned?"* or *"Who is our top broker?"*\n` +
         `- **Projects**: *"What is the commission for [Project Name]?"*\n` +
         `- **Flats**: *"What was the commission on flat [Number]?"*`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON
  app.use(express.json({ limit: '10mb' }));

  // API Route for chatbot
  app.post("/api/chatbot/ask", async (req, res) => {
    try {
      const { question, contextData } = req.body;
      if (!question) {
        return res.status(400).json({ error: "Question is required." });
      }

      // Verify if Gemini API Key is configured. If not, use local solver immediately!
      const client = getAIClient();
      if (!client) {
        const localAns = calculateLocalAnswer(question, contextData);
        return res.json({
          answer: `**Note:** The system's Gemini API Key is not set yet. I have calculated this real-time answer from your local database instead:\n\n${localAns}`
        });
      }

      // Format current system date/time
      const systemTime = new Date().toLocaleString();

      // System prompt to ground the answers
      const systemInstruction = `
You are the interactive, professional AI financial assistant for "SyncAI Consultancy Pvt. Ltd.", integrated into their Broker Commission Management System.
The user is asking a question about real estate sales, commissions, brokers, projects, or payments.

CRITICAL RULES:
1. GROUND EVERY ANSWER IN THE ACTUAL DATA PROVIDED below. Never guess, invent, hallucinate, or use outdated/cached facts, numbers, names, properties, or amounts. If the user asks about a broker or project that isn't in the provided data, or if there is no data at all, clearly and politely state that you don't have records for that.
2. KEEP RESPONSES SHORT AND IN PLAIN LANGUAGE. Avoid long paragraphs or overly dense technical jargon. Use bullet points or small, beautifully structured layouts when listing items.
3. FOR LIST-TYPE ANSWERS: Show a short, highly readable list (e.g., top 5) with a polite note like "and X more - check the Reports screen for the full list" instead of a huge, raw text dump.
4. HANDLE UNCLEAR OR OUT-OF-SCOPE QUESTIONS GRACEFULLY:
   - If a question is vague (e.g., "how are we doing?"), give a short, high-level business overview based on the current metrics (total sales, total commission, pending commission, paid commission).
   - If a question is genuinely unrelated to commissions, brokers, or real estate sales, politely state that you only know about the commission data in this application, and briefly remind the user of the types of questions you can answer (e.g., "I can help you check broker earnings, project totals, pending payouts, or top brokers!").
5. Return answers in friendly, objective, professional plain English. Do not refer to database terms like "localStorage", "contextData", or technical variables. Talk to the user as a real-time smart financial assistant.

CONTEXT DATA FROM THE COMMISSION PORTAL:
- Current Local Time: ${systemTime}
- Brokers (People): ${JSON.stringify(contextData?.brokers || [])}
- Projects: ${JSON.stringify(contextData?.projects || [])}
- Properties (Flats/Units): ${JSON.stringify(contextData?.properties || [])}
- Sales: ${JSON.stringify(contextData?.sales || [])}
- Commissions (Commission Entries): ${JSON.stringify(contextData?.commissions || [])}
- Payments (Payout Transactions): ${JSON.stringify(contextData?.payments || [])}
`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: question,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });

      res.json({ answer: response?.text || "No response received." });
    } catch (error: any) {
      console.warn("Gemini API error detected, executing local fallback answer:", error);
      // Fallback local calculations when 429 Quota Exceeded or any other rate-limiting error occurs
      const localAns = calculateLocalAnswer(req.body.question, req.body.contextData);
      res.json({
        answer: `**Note:** The Gemini API free quota limit has been reached. I have resolved your question instantly by calculating it in real-time from your live database:\n\n${localAns}`
      });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
