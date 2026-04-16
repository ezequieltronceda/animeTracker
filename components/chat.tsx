'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  username: string;
}

interface Message {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
}

export function Chat() {
  const socketRef = useRef<Socket | null>(null);
  const [username, setUsername] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (socketRef.current) return;

    const newSocket = io();
    socketRef.current = newSocket;

    newSocket.on('init', (data: { users: User[]; messages: Message[] }) => {
      setUsers(data.users);
      setMessages(data.messages);
    });

    newSocket.on('userJoined', (user: User) => {
      setUsers((prev) => [...prev, user]);
    });

    newSocket.on('userLeft', (userId: string) => {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    });

    newSocket.on('usernameChanged', (data: { userId: string; username: string }) => {
      setUsers((prev) => prev.map((u) => u.id === data.userId ? { ...u, username: data.username } : u));
      setMessages((prev) => prev.map((m) => m.userId === data.userId ? { ...m, username: data.username } : m));
    });

    newSocket.on('newMessage', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleJoin = () => {
    if (username.trim() && socketRef.current) {
      socketRef.current.emit('join', username.trim());
      setIsJoined(true);
    }
  };

  const handleSendMessage = () => {
    if (message.trim() && socketRef.current) {
      socketRef.current.emit('sendMessage', message.trim());
      setMessage('');
    }
  };

  const handleChangeName = () => {
    if (newUsername.trim() && socketRef.current) {
      socketRef.current.emit('changeUsername', newUsername.trim());
      setUsername(newUsername.trim());
      setIsEditingName(false);
      setNewUsername('');
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-700 text-white shadow-lg hover:bg-zinc-600"
      >
        💬
      </button>
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
        <audio ref={audioRef} src="/yamete.mp3" preload="auto" />
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-72 rounded-lg bg-zinc-900 shadow-lg">
      <div className="flex items-center justify-between border-b border-zinc-800 p-3">
        <h3 className="text-white">Chat ({users.length})</h3>
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