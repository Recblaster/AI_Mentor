import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, Volume2 } from "lucide-react";

interface FrequencyPlayerProps {
  frequency: number;
  duration: number;
}

export const FrequencyPlayer: React.FC<FrequencyPlayerProps> = ({ frequency, duration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      stopFrequency();
    };
  }, []);

  const createAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const playFrequency = async () => {
    try {
      const audioContext = createAudioContext();
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Create oscillator and gain nodes
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Set frequency and wave type
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';

      // Set volume (start low for comfort)
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);

      // Start the oscillator
      oscillator.start();

      oscillatorRef.current = oscillator;
      gainNodeRef.current = gainNode;
      setIsPlaying(true);
      setTimeRemaining(duration);

      // Start countdown timer
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            stopFrequency();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto-stop after duration
      setTimeout(() => {
        stopFrequency();
      }, duration * 1000);

    } catch (error) {
      console.error('Error playing frequency:', error);
    }
  };

  const stopFrequency = () => {
    if (oscillatorRef.current) {
      try {
        // Fade out
        if (gainNodeRef.current && audioContextRef.current) {
          gainNodeRef.current.gain.linearRampToValueAtTime(0, audioContextRef.current.currentTime + 0.1);
        }
        
        setTimeout(() => {
          if (oscillatorRef.current) {
            oscillatorRef.current.stop();
            oscillatorRef.current = null;
          }
        }, 100);
      } catch (error) {
        console.error('Error stopping frequency:', error);
      }
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsPlaying(false);
    setTimeRemaining(duration);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stopFrequency();
    } else {
      playFrequency();
    }
  };

  // Generate waveform visualization
  const generateWaveform = () => {
    const points = [];
    const width = 200;
    const height = 40;
    const amplitude = height / 3;
    const wavelength = width / (frequency / 100); // Adjust wavelength based on frequency
    
    for (let x = 0; x <= width; x += 2) {
      const y = height / 2 + amplitude * Math.sin((2 * Math.PI * x) / wavelength);
      points.push(`${x},${y}`);
    }
    
    return `M ${points.join(' L ')}`;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800 p-6 max-w-md mx-auto">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Volume2 className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-800 dark:text-green-200">Healing Frequency</span>
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">
            {formatTime(timeRemaining)}
          </div>
        </div>

        {/* Waveform Visualization */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
          <div className="text-center mb-3">
            <span className="text-lg font-semibold text-green-700 dark:text-green-300">
              Frequency: {frequency} Hz
            </span>
          </div>
          
          <div className="flex justify-center mb-4">
            <svg width="200" height="40" className="overflow-visible">
              <path
                d={generateWaveform()}
                stroke={isPlaying ? "#10b981" : "#6b7280"}
                strokeWidth="2"
                fill="none"
                className={isPlaying ? "animate-pulse" : ""}
              />
            </svg>
          </div>

          {/* Play/Pause Button */}
          <div className="flex justify-center">
            <Button
              onClick={togglePlayback}
              className={`w-16 h-16 rounded-full ${
                isPlaying 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-green-500 hover:bg-green-600'
              } text-white shadow-lg transition-all duration-300`}
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-1" />
              )}
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-1000 ease-linear"
              style={{ 
                width: `${((duration - timeRemaining) / duration) * 100}%` 
              }}
            />
          </div>
          <div className="text-xs text-center text-green-600 dark:text-green-400">
            {isPlaying ? 'Playing healing frequency...' : 'Ready to play'}
          </div>
        </div>
      </div>
    </Card>
  );
};