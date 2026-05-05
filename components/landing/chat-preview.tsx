"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState } from "react"
import { Bot, User, Send } from "lucide-react"
import ChatPreviewComponent from "../chat-preview"

const chatMessages = [
  {
    type: "user",
    message: "What are your business hours?",
    time: "10:24 AM"
  },
  {
    type: "bot",
    message: "We're open Monday through Friday from 9 AM to 6 PM EST. Our AI chatbot is available 24/7 to assist you with common questions!",
    time: "10:24 AM"
  },
  {
    type: "user",
    message: "How can I integrate this with my website?",
    time: "10:25 AM"
  },
  {
    type: "bot",
    message: "Integration is super easy! Just copy our embed code and paste it into your website's HTML. You can also use our WordPress plugin or JavaScript SDK. Would you like me to send you the integration guide?",
    time: "10:25 AM"
  }
]

export default function ChatPreview() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [activeMessage, setActiveMessage] = useState(0)

  return (
    <section ref={ref} className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/20 backdrop-blur-sm">
              <Bot className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Live Chat Preview</span>
            </div>

            <h2 className="text-4xl md:text-6xl font-bold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                See It In
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary to-secondary">
                Action
              </span>
            </h2>

            <p className="text-xl text-muted-foreground leading-relaxed">
              Experience the power of AI-driven conversations. Our chatbot understands context, 
              provides accurate answers, and delivers exceptional customer experiences.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                </div>
                <div>
                  <div className="font-semibold mb-1">Instant Responses</div>
                  <div className="text-sm text-muted-foreground">
                    Answer customer questions in under 2 seconds
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <div className="font-semibold mb-1">Context-Aware AI</div>
                  <div className="text-sm text-muted-foreground">
                    Understands conversation flow and provides relevant answers
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <div className="font-semibold mb-1">Natural Conversations</div>
                  <div className="text-sm text-muted-foreground">
                    Feels like talking to a real human assistant
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Content - Chat Interface */}
          <ChatPreviewComponent />
        </div>
      </div>
    </section>
  )
}
