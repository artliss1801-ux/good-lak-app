'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { useGoodLakStore } from '@/store/good-lak-store';

export function CommentScreen() {
  const { selectedAppointment, setScreen, setError } = useGoodLakStore();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/good-lak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addComment',
          appointmentId: selectedAppointment?.id,
          comment: comment.trim()
        })
      });
      const data = await response.json();
      if (data.success) {
        setScreen('my-appointments');
      } else {
        setError(data.error || 'Ошибка отправки комментария');
      }
    } catch (error) {
      setError('Ошибка соединения');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 via-white to-cyan-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-pink-500 to-cyan-500 p-4 shadow-lg">
        <div className="flex items-center max-w-md mx-auto">
          <button
            onClick={() => setScreen('my-appointments')}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors mr-4"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <h1 className="text-xl font-semibold text-white">Комментарий мастеру</h1>
        </div>
      </header>
      
      {/* Content */}
      <div className="flex-1 p-4 max-w-md mx-auto w-full">
        <Card className="border-0 shadow-lg mb-4">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 mb-1">Запись</p>
            <p className="font-medium text-gray-800">
              {selectedAppointment?.masterName} • {selectedAppointment?.serviceName}
            </p>
            <p className="text-sm text-gray-600">
              {selectedAppointment?.date} в {selectedAppointment?.time}
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ваш комментарий
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Напишите комментарий мастеру..."
              className="min-h-[150px] resize-none border-gray-200 focus:border-pink-300 focus:ring-pink-200"
              disabled={isSubmitting}
            />
          </CardContent>
        </Card>
        
        <Button
          onClick={handleSubmit}
          disabled={!comment.trim() || isSubmitting}
          className="w-full h-14 mt-4 text-lg bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 text-white rounded-xl shadow-lg disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Send className="mr-2 h-5 w-5" />
              Отправить мастеру
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
