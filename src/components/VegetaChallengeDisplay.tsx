import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, Zap, Target, Crown } from "lucide-react";

interface VegetaChallengeProps {
  challenge: string;
  powerLevel: {
    current: number;
    target: number;
  };
  rivalComparison: {
    name: string;
    feat: string;
  };
  insult: string;
  motivation: string;
}

export const VegetaChallengeDisplay: React.FC<VegetaChallengeProps> = ({
  challenge,
  powerLevel,
  rivalComparison,
  insult,
  motivation
}) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [powerProgress, setPowerProgress] = useState(0);

  const handleChallengeComplete = () => {
    setIsCompleted(true);
    // Animate power level increase
    const targetProgress = (powerLevel.current / powerLevel.target) * 100;
    let currentProgress = 0;
    const increment = targetProgress / 50; // 50 steps for smooth animation
    
    const interval = setInterval(() => {
      currentProgress += increment;
      if (currentProgress >= targetProgress) {
        currentProgress = targetProgress;
        clearInterval(interval);
      }
      setPowerProgress(currentProgress);
    }, 20);
  };

  const getRivalIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'kakarot':
      case 'goku':
        return '🥕'; // Carrot for Kakarot
      case 'frieza':
        return '❄️';
      case 'myself':
      case 'vegeta':
        return '👑';
      case 'cell':
        return '🧬';
      case 'majin buu':
      case 'buu':
        return '🍭';
      default:
        return '⚡';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-red-600 to-red-800 text-white p-6 max-w-lg mx-auto border-red-500 shadow-2xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Crown className="h-6 w-6 text-yellow-400" />
            <span className="font-bold text-xl">VEGETA'S CHALLENGE</span>
          </div>
          <Badge variant="secondary" className="bg-red-900 text-red-100">
            SAIYAN PRINCE
          </Badge>
        </div>

        {/* Challenge Section */}
        <div className="bg-red-900/50 rounded-lg p-4 border border-red-400">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-yellow-400" />
              <span className="font-semibold text-lg">YOUR CHALLENGE</span>
            </div>
            {!isCompleted && (
              <Button
                onClick={handleChallengeComplete}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="h-4 w-4 mr-1" />
                Complete
              </Button>
            )}
            {isCompleted && (
              <Badge className="bg-green-600 text-white">
                <Check className="h-3 w-3 mr-1" />
                COMPLETED
              </Badge>
            )}
          </div>
          <p className="text-red-100 leading-relaxed">{challenge}</p>
        </div>

        {/* Power Level Section */}
        <div className="bg-red-900/50 rounded-lg p-4 border border-red-400">
          <div className="flex items-center space-x-2 mb-3">
            <Zap className="h-5 w-5 text-yellow-400" />
            <span className="font-semibold text-lg">POWER LEVEL</span>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-red-200">Current:</span>
              <span className="font-mono text-xl font-bold text-yellow-400">
                {powerLevel.current.toLocaleString()}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-red-200">Target:</span>
              <span className="font-mono text-xl font-bold text-green-400">
                {powerLevel.target.toLocaleString()}
              </span>
            </div>
            
            <div className="space-y-2">
              <Progress 
                value={powerProgress} 
                className="h-3 bg-red-800"
              />
              <div className="text-center text-sm text-red-200">
                {Math.round(powerProgress)}% to target
              </div>
            </div>
          </div>
        </div>

        {/* Rival Comparison Section */}
        <div className="bg-red-900/50 rounded-lg p-4 border border-red-400">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-2xl">{getRivalIcon(rivalComparison.name)}</span>
            <span className="font-semibold text-lg">RIVAL COMPARISON</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-red-200">Rival:</span>
              <Badge variant="outline" className="border-yellow-400 text-yellow-400">
                {rivalComparison.name.toUpperCase()}
              </Badge>
            </div>
            <p className="text-red-100 text-sm">
              <strong>Their Achievement:</strong> {rivalComparison.feat}
            </p>
          </div>
        </div>

        {/* Insult & Motivation */}
        <div className="space-y-3">
          <div className="bg-red-950/70 rounded-lg p-3 border-l-4 border-red-400">
            <p className="text-red-200 italic font-medium">"{insult}"</p>
          </div>
          
          <div className="bg-yellow-900/30 rounded-lg p-3 border-l-4 border-yellow-400">
            <p className="text-yellow-100 font-medium">{motivation}</p>
          </div>
        </div>

        {/* Completion Message */}
        {isCompleted && (
          <div className="bg-green-900/50 rounded-lg p-4 border border-green-400 animate-pulse">
            <div className="text-center">
              <Check className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <p className="text-green-200 font-bold">
                EXCELLENT! Your power level is rising!
              </p>
              <p className="text-green-300 text-sm mt-1">
                Even I, the Prince of all Saiyans, acknowledge your progress!
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};