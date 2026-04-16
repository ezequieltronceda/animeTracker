'use client';

import { useEffect, useState, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
}

export function Chat() {
  const [username, setUsername] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const userIdRef = useRef<string>('');

  useEffect(() => {
    if (!isJoined) return;

    const q = query(
      collection(db, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      
      if (msgs.length > 0 && audioRef.current) {
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg.userId !== userIdRef.current) {
          audioRef.current.play().catch(() => {});
        }
      }
    });

    return () => unsubscribe();
  }, [isJoined]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleJoin = () => {
    if (username.trim()) {
      userIdRef.current = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setIsJoined(true);
    }
  };

  const handleSendMessage = async () => {
    if (message.trim() && isJoined) {
      await addDoc(collection(db, 'messages'), {
        userId: userIdRef.current,
        username: username,
        text: message.trim(),
        timestamp: Date.now()
      });
      setMessage('');
    }
  };

  const handleChangeName = () => {
    if (newUsername.trim()) {
      setUsername(newUsername.trim());
      setIsEditingName(false);
      setNewUsername('');
    }
  };

  if (!isOpen) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-700 text-white shadow-lg hover:bg-zinc-600"
        >
          💬
        </button>
        <audio ref={audioRef} src="/yamete.mp3" preload="auto" />
      </>
    );
  }

  if (!isJoined) {
    return (
      <div className="fixed bottom-4 right-4 w-72 rounded-lg bg-zinc-900 p-4 shadow-lg">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-white">Chat en vivo</h3>
          <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white">
            ✕
          </button>
        </div>
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Ingresa tu nombre"
          className="mb-2"
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
        />
        <Button onClick={handleJoin} className="w-full">
          Unirse
        </Button>
        <audio ref={audioRef} src="/ yamete.mp3" preload="auto" />
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-72 rounded-lg bg-zinc-900 shadow-lg">
      <div className="flex items-center justify-between border-b border-zinc-800 p-3">
        <h3 className="text-white">Chat</h3>
        <div className="flex items-center gap-2">
          {isEditingName ? (
            <>
              <Input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Nuevo nombre"
                className="h-6 w-24 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleChangeName()}
              />
              <button onClick={handleChangeName} className="text-green-400 text-xs">✓</button>
              <button onClick={() => setIsEditingName(false)} className="text-zinc-400 text-xs">✕</button>
            </>
          ) : (
            <button onClick={() => setIsEditingName(true)} className="text-zinc-400 hover:text-white text-xs">
              ✏️
            </button>
          )}
          <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white">
            ✕
          </button>
        </div>
      </div>

      <div className="h-64 overflow-y-auto p-3">
        {messages.map((msg) => (
          <div key={msg.id} className="mb-2">
            <span className="font-medium text-zinc-400">{msg.username}: </span>
            <span className="text-white">{msg.text}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 border-t border-zinc-800 p-3">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe un mensaje"
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <Button onClick={handleSendMessage}>Enviar</Button>
      </div>

      <audio ref={audioRef} src="/yamete.mp3" preload="auto" />
    </div>
  );
}