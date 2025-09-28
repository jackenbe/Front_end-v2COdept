import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Editor from '@monaco-editor/react';

// highlight.js (import + languages)
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import csharp from 'highlight.js/lib/languages/csharp';
import cpp from 'highlight.js/lib/languages/cpp';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import 'highlight.js/styles/atom-one-dark.css';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('java', java);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('go', go);
hljs.registerLanguage('rust', rust);

// Optional: loads Tailwind via CDN (you can remove this if you already include Tailwind)
const CDNLoader = () => (
  <>
    <script src="https://cdn.tailwindcss.com"></script>
  </>
);

// ------------------ MessageContent (JSX) ------------------
const parseTextBlocks = (text = '') => {
  // split into paragraph-like blocks by two or more newlines
  const blocks = [];
  const paragraphs = text
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const p of paragraphs) {
    if (p.startsWith('###')) {
      blocks.push({ type: 'header', text: p.replace(/^###\s*/, '').trim() });
    } else if (/^(?:[-*]\s+)/m.test(p)) {
      // list paragraph
      const items = p
        .split(/\n/)
        .map((l) => l.replace(/^[\s]*[-*]\s*/, '').trim())
        .filter(Boolean);
      blocks.push({ type: 'list', items });
    } else {
      blocks.push({ type: 'paragraph', text: p });
    }
  }
  return blocks;
};

const parseMessage = (text = '') => {
  // Find fenced code blocks and interleave them with text blocks
  const blocks = [];
  const regex = /```([a-zA-Z0-9+-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let m;

  while ((m = regex.exec(text)) !== null) {
    const index = m.index;
    if (index > lastIndex) {
      const preText = text.slice(lastIndex, index);
      blocks.push(...parseTextBlocks(preText));
    }
    const lang = m[1] || 'plaintext';
    const code = m[2];
    blocks.push({ type: 'code', lang, code });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    const tail = text.slice(lastIndex);
    blocks.push(...parseTextBlocks(tail));
  }

  return blocks;
};

const MessageContent = React.memo(({ message }) => {
  if (!message) return null;
  // message: { sender: 'ai'|'user', text: '...' }
  if (message.sender !== 'ai') {
    // simple user rendering
    return <p className="text-white whitespace-pre-wrap">{message.text}</p>;
  }

  const blocks = parseMessage(message.text);

  return (
    <div className="space-y-3 prose prose-invert max-w-none text-sm">
      {blocks.map((b, i) => {
        if (b.type === 'header') {
          const header = b.text;
          let icon = '';
          if (/hint/i.test(header)) icon = '💡 ';
          else if (/improvement/i.test(header)) icon = '🛠️ ';
          else if (/lesson/i.test(header)) icon = '📘 ';
          else if (/skill/i.test(header)) icon = '🎯 ';

          return (
            <h4
              key={i}
              className="text-md font-semibold text-teal-300 pt-2 mb-1 border-b border-gray-700 pb-1"
            >
              {icon}
              {header}
            </h4>
          );
        }

        if (b.type === 'list') {
          return (
            <ul key={i} className="list-disc list-inside space-y-1 text-gray-200">
              {b.items.map((it, j) => (
                <li key={j}>{it}</li>
              ))}
            </ul>
          );
        }

        if (b.type === 'paragraph') {
          return (
            <p key={i} className="text-gray-100 whitespace-pre-wrap">
              {b.text}
            </p>
          );
        }

        if (b.type === 'code') {
          const { code, lang } = b;
          // highlight (if language registered, use it; otherwise auto-detect)
          let highlighted = '';
          try {
            if (lang && hljs.getLanguage(lang)) {
              highlighted = hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
            } else {
              highlighted = hljs.highlightAuto(code).value;
            }
          } catch (err) {
            highlighted = hljs.highlightAuto(code).value;
          }

          return (
            <pre key={i} className="bg-gray-900 rounded-lg p-3 overflow-x-auto shadow">
              <code
                className={`hljs language-${lang}`}
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            </pre>
          );
        }

        return null;
      })}
    </div>
  );
});

// ------------------ Monaco Code Editor ------------------
function CodeEditor({ code, setCode, language }) {
  return (
    <Editor
      height="600px"
      defaultLanguage={language}
      language={language}
      value={code}
      onChange={(val) => setCode(val || '')}
      theme="vs-dark"
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
      }}
    />
  );
}

// ------------------ ScriptEditor (main) ------------------
const ScriptEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [scriptId, setScriptId] = useState(id);
  const [name, setName] = useState('New Script');
  const [code, setCode] = useState(
    '// Write your code here, then click Save and Run Code.\nfunction greet() {\n  console.log("Hello World!");\n}\ngreet();'
  );
  const [language, setLanguage] = useState('javascript');
  const [message, setMessage] = useState('');
  const [output, setOutput] = useState('');
  const [input, setInput] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  // Chatbox state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I'm your AI coding assistant. Save your script first, then ask me for help or advice on the code in the editor.",
    },
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const languages = ['python', 'javascript', 'java', 'csharp', 'cpp', 'go', 'rust'];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadChatHistory = useCallback(
    async () => {
      if (!scriptId) return;
      try {
        const response = await axios.get(`/api/chat-history/?script_id=${scriptId}`);
        const formattedMessages = response.data.history.map((msg) => ({
          sender: msg.role,
          text: msg.content,
        }));
        setChatMessages(formattedMessages);
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    },
    [scriptId]
  );

  const fetchScript = async () => {
    try {
      const response = await axios.post('/api/get-script/', { id: scriptId });
      setName(response.data.name);
      setCode(response.data.code);
      setLanguage(response.data.language || 'javascript');
      loadChatHistory();
    } catch (error) {
      setMessage('Failed to load script or script does not exist.');
      console.error(error);
    }
  };

  useEffect(() => {
    if (scriptId) {
      fetchScript();
    } else {
      setName('New Script');
      setCode('// Write your code here, then click Save and Run Code.');
      setLanguage('javascript');
      setMessage('');
      setOutput('');
      setInput('');
      setChatMessages([
        {
          sender: 'ai',
          text: "Hello! I'm your AI coding assistant. Save your script first, then ask me for help or advice on the code in the editor.",
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptId, id]);

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      if (scriptId) {
        await axios.put(`/api/update/${scriptId}/`, { name, code, language });
        setMessage('Script updated successfully!');
      } else {
        const response = await axios.post('/api/create-script/', { name, code, language });
        setMessage('Script created successfully! You can now use the AI chat.');
        const newId = response.data.id;
        setScriptId(newId);
        navigate(`/script/${newId}`);
      }
    } catch (error) {
      setMessage('Operation failed: ' + (error.response?.data.detail || 'An error occurred.'));
      console.error(error);
    }
  };

  const handleRunCode = async () => {
    setOutput('Running code...');
    try {
      const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
        language,
        version: '*',
        files: [{ content: code }],
        stdin: input,
      });
      const { run } = response.data;
      if (run.stdout) setOutput(run.stdout.replace(/\r?\n/g, '<br />'));
      else if (run.stderr) setOutput(`Error: ${run.stderr.replace(/\r?\n/g, '<br />')}`);
      else setOutput('No output or error returned.');
    } catch (error) {
      console.error(error);
      setOutput('Execution failed. Please check your code or try again later. (Error details logged to console).');
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    if (!scriptId) {
      await handleSave({ preventDefault: () => {} });
      return;
    }

    const userMessage = { sender: 'user', text: chatInput };
    setChatMessages((prev) => [...prev, userMessage]);
    const currentInput = chatInput;
    setChatInput('');
    setIsChatLoading(true);

    try {
      await axios.post('/api/ai-advice/', { user_message: currentInput, code, language, script_id: scriptId });
      // small delay to allow server to write chat history
      await new Promise((resolve) => setTimeout(resolve, 800));
      await loadChatHistory();
    } catch (error) {
      const errorMessage = error.response
        ? `API Error (${error.response.status}): ${error.response.data.detail || 'Server processing failed.'}`
        : 'Network/Server connection error.';
      setChatMessages((prev) => {
        const tempRemoved = prev.filter((msg) => msg.text !== userMessage.text || msg.sender !== userMessage.sender);
        return [...tempRemoved, { sender: 'ai', text: `Failed to get AI response: ${errorMessage}` }];
      });
      console.error('AI Advice Error:', error);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4 md:p-8">
      <CDNLoader />
      <div className="bg-white p-6 rounded-xl shadow-2xl relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div className="relative">
            <h2 onClick={() => setIsEditingName(true)} className="text-3xl font-extrabold text-gray-800 hover:text-blue-600 cursor-pointer transition duration-200">
              {name || 'New Script'}
            </h2>
            {isEditingName && (
              <div className="absolute top-0 left-0 bg-white p-4 rounded-lg shadow-xl z-10 border border-blue-400 w-64 md:w-80">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setIsEditingName(false)} className="w-full px-2 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
              </div>
            )}
          </div>

          <div className="flex space-x-4">
            <select id="language-select" value={language} onChange={(e) => setLanguage(e.target.value)} className="px-4 py-2 border rounded-xl bg-blue-500 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-md">
              {languages.map((lang) => <option key={lang} value={lang}>{lang}</option>)}
            </select>
          </div>
        </div>

        {message && <p className="text-sm text-green-600 mb-4 font-medium bg-green-50 p-2 rounded-lg">{message}</p>}

        {/* Main Layout */}
        <div className="flex flex-col xl:flex-row xl:space-x-6" style={{ minHeight: '80vh' }}>
          {/* Code Editor */}
          <div className="flex-1 xl:w-2/3 mb-4 xl:mb-0 rounded-xl overflow-hidden border border-gray-300 flex flex-col shadow-lg" style={{ minHeight: '600px', height: '100%' }}>
            <CodeEditor code={code} setCode={setCode} language={language} />

            <div className="flex space-x-4 p-4 bg-gray-100 border-t">
              <button onClick={handleSave} className="flex-1 bg-green-500 text-white font-semibold py-3 rounded-xl hover:bg-green-600 transition duration-300 shadow-md">{scriptId ? 'Save Changes' : 'Create Script'}</button>
              <button onClick={handleRunCode} className="flex-1 bg-purple-500 text-white font-semibold py-3 rounded-xl hover:bg-purple-600 transition duration-300 shadow-md">Run Code</button>
            </div>
          </div>

          {/* Output & Chat */}
          <div className="flex-1 xl:w-1/3 flex flex-col space-y-6">
            <div className="flex flex-col md:flex-row xl:flex-col space-y-4 md:space-y-0 md:space-x-4 xl:space-x-0 xl:space-y-4 h-full">
              {/* Input */}
              <div className="bg-gray-800 text-white p-4 rounded-xl shadow-inner flex-1 flex flex-col overflow-hidden min-h-40 max-h-56">
                <h3 className="font-bold text-lg mb-2 text-yellow-300">Standard Input (stdin):</h3>
                <textarea value={input} onChange={(e) => setInput(e.target.value)} className="w-full h-full bg-gray-900 text-white p-3 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 resize-none font-mono text-sm" placeholder="Enter inputs here (e.g., numbers, names, one per line)" />
              </div>

              {/* Output */}
              <div className="bg-gray-800 text-white p-4 rounded-xl shadow-inner flex-1 overflow-hidden min-h-40 max-h-56">
                <h3 className="font-bold text-lg mb-2 text-yellow-300">Execution Output:</h3>
                <pre className="whitespace-pre-wrap h-full overflow-y-auto bg-gray-900 p-3 rounded-lg font-mono text-sm" dangerouslySetInnerHTML={{ __html: output }} />
              </div>
            </div>

            {/* AI Chatbox */}
            <div className="bg-gray-700 p-4 rounded-xl shadow-2xl text-white flex flex-col flex-1">
              <h3 className="text-2xl font-extrabold mb-4 border-b border-gray-600 pb-2 text-blue-300">AI Tutor Assistant</h3>
              <div className="flex-1 overflow-y-auto mb-4 p-2 bg-gray-800 rounded-lg flex flex-col space-y-4 shadow-inner max-h-[400px]">
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-4 rounded-xl max-w-full md:max-w-md shadow-lg ${msg.sender === 'user' ? 'bg-blue-600' : 'bg-gray-600'}`}>
                      <MessageContent message={msg} />
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
                {isChatLoading && <div className="flex justify-start"><p className="text-gray-400 p-4 bg-gray-600 rounded-xl max-w-xs animate-pulse">AI is thinking...</p></div>}
              </div>
              <div className="flex space-x-2 pt-2">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !isChatLoading) handleSendMessage(); }} placeholder={scriptId ? 'Ask for advice on your code...' : 'Save script to start chat...'} className="flex-1 px-4 py-2 rounded-xl bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={!scriptId || isChatLoading} />
                <button onClick={handleSendMessage} disabled={!scriptId || isChatLoading} className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-xl hover:bg-blue-600 transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed shadow-md">Send</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptEditor;
