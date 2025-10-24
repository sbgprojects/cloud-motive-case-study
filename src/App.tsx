// src/App.tsx
import { useRef, useState, useCallback, useEffect } from 'react';
import PDFViewer from './components/PDFViewer';
import { pdfjs } from "react-pdf";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Moon, Sun } from 'lucide-react';
// import 'react-pdf/dist/Page/AnnotationLayer.css';
// import 'react-pdf/dist/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

type Citation = {
   id: number;
   text: string;
   page: number;
};

type Message = {
   id: string;
   content: string;
   isUser: boolean;
   timestamp: Date;
   citations?: Citation[];
};

// Sample PDF file - replace with your actual PDF
const samplePdf = "/assets/report.pdf";

// Sample responses with citations based on Maersk Q2 2025 Interim Report
const sampleResponses: Message[] = [
   {
      id: '1',
      content: 'The report shows that EBITDA improvements were driven by operational performance, including volume growth, cost control, and margin improvements across Ocean, Logistics & Services, and Terminals segments [1][2].',
      isUser: false,
      timestamp: new Date(),
      citations: [
         { id: 1, text: 'Maersk’s results continued to improve year-on-year', page: 3 },
         { id: 2, text: 'EBITDA increased to USD 2.3 bn (USD 2.1 bn)', page: 5 }
      ]
   },
   {
      id: '2',
      content: 'The gain on sale of non-current assets was USD 25 million in Q2 2025, significantly lower than USD 208 million in Q2 2024, but these amounts are reported separately under EBIT and not included in EBITDA [3].',
      isUser: false,
      timestamp: new Date(),
      citations: [
         { id: 3, text: 'Gain on sale of non-current assets', page: 15 }
      ]
   },
   {
      id: '3',
      content: 'EBITDA for Q2 2025 increased to USD 2.3 billion from USD 2.1 billion in the prior year, with Ocean, Logistics & Services, and Terminals all contributing to the growth [1][2].',
      isUser: false,
      timestamp: new Date(),
      citations: [
         { id: 1, text: 'Maersk’s results continued to improve year-on-year', page: 3 },
         { id: 2, text: 'EBITDA increased to USD 2.3 bn (USD 2.1 bn)', page: 5 }
      ]
   }
];

function App() {
   const pdfViewerRef = useRef<any>(null);
   const [messages, setMessages] = useState<Message[]>(sampleResponses);
   const [inputMessage, setInputMessage] = useState('');
   const [darkMode, setDarkMode] = useState(() => {
      // Check for saved theme preference or use system preference
      if (typeof window !== 'undefined') {
         const savedTheme = localStorage.getItem('theme');
         if (savedTheme) return savedTheme === 'dark';
         return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      return false;
   });

   // Toggle dark mode
   const toggleDarkMode = () => {
      setDarkMode(prev => !prev);
   };

   // Update the HTML class and save preference when darkMode changes
   useEffect(() => {
      if (darkMode) {
         document.documentElement.classList.add('dark');
         localStorage.setItem('theme', 'dark');
      } else {
         document.documentElement.classList.remove('dark');
         localStorage.setItem('theme', 'light');
      }
   }, [darkMode]);

   // Handle citation click to highlight text in PDF
   const handleCitationClick = useCallback((citation: Citation) => {
      if (pdfViewerRef.current) {
         // Store the highlight result
         const highlightResult = pdfViewerRef.current.highlightText(citation.text);

         // Show a dialog when text is not found
         if (!highlightResult || !highlightResult.found) {
            alert(`The reference "${citation.text}" could not be found on page ${citation.page}.`);
         }
      }
   }, []);

   // Format message content with clickable citations
   const formatMessageContent = (content: string, citations?: Citation[]) => {
      if (!citations || citations.length === 0) return content;

      // Replace [n] with clickable spans
      return content.split(/(\[\d+\])/g).map((part, index) => {
         const match = part.match(/\[(\d+)\]/);
         if (match) {
            const citationId = parseInt(match[1], 10);
            const citation = citations.find(c => c.id === citationId);
            if (citation) {
               return (
                  <span
                     key={index}
                     className="text-blue-600 hover:underline cursor-pointer"
                     onClick={() => handleCitationClick(citation)}
                  >
                     {part}
                  </span>
               );
            }
         }
         return part;
      });
   };

   // Handle sending a new message
   const handleSendMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputMessage.trim()) return;

      // Add user message
      const newMessage: Message = {
         id: Date.now().toString(),
         content: inputMessage,
         isUser: true,
         timestamp: new Date()
      };

      setMessages(prev => [...prev, newMessage]);
      setInputMessage('');

      // Simulate AI response (in a real app, this would be an API call)
      setTimeout(() => {
         // Find a response that matches the user's message
         const response = {
            id: (Date.now() + 1).toString(),
            content: 'This is a sample response with a citation [1].',
            isUser: false,
            timestamp: new Date(),
            citations: [
               { id: 1, text: 'Sample citation text', page: 1 }
            ]
         };
         setMessages(prev => [...prev, response]);
      }, 1000);
   };

   return (
      <div>
         <div className="flex h-[calc(100vh-32px)] bg-gray-100 dark:bg-gray-900">
            {/* PDF Viewer */}
            <div className="w-2/3 h-full border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
               <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center max-h-[61px]">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Financials</h2>
                  <Button
                     variant="ghost"
                     size="icon"
                     onClick={toggleDarkMode}
                     className="text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                     aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                     {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </Button>
               </div>
               <div className="overflow-hidden">
                  <PDFViewer
                     ref={pdfViewerRef}
                     file={samplePdf}
                  />
               </div>
            </div>

            {/* Chat Interface */}
            <div className="flex flex-col w-1/3 h-full bg-white dark:bg-gray-800">
               <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Chat</h2>
               </div>

               {/* Messages */}
               <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                     <div
                        key={message.id}
                        className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                     >
                        {!message.isUser && (
                           <Avatar className="h-8 w-8 mr-2 mt-1">
                              <AvatarFallback>AI</AvatarFallback>
                           </Avatar>
                        )}
                        <div
                           className={`max-w-3/4 rounded-lg px-4 py-2 ${message.isUser
                                 ? 'bg-blue-500 text-white rounded-br-none'
                                 : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
                              }`}
                        >
                           <div className="whitespace-pre-wrap">
                              {formatMessageContent(message.content, message.citations)}
                           </div>
                           <div className="text-xs mt-1 opacity-70">
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </div>
                        </div>
                        {message.isUser && (
                           <Avatar className="h-8 w-8 ml-2 mt-1">
                              <AvatarFallback>U</AvatarFallback>
                           </Avatar>
                        )}
                     </div>
                  ))}
               </div>

               {/* Message Input */}
               <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                     <Input
                        type="text"
                        placeholder="Ask about your chat data..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        className="flex-1"
                     />
                     <Button type="submit" size="icon">
                        <Send className="h-4 w-4" />
                     </Button>
                  </form>
               </div>
            </div>

         </div>
         {/* Credits */}
         <div className='w-full p-2 grid place-content-center whitespace-nowrap bg-gray-100 dark:bg-gray-900 text-xs z-50'>
            <span>Developed by <a target='_blank' className='text-blue-600 dark:text-blue-400 font-bold' href="https://www.linkedin.com/in/sbgprojects">Shubham Gujarathi</a></span>
         </div>
      </div>
   );
}

export default App;
