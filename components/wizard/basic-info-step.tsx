'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BasicInfoStepProps {
  data: any;
  setData: (data: any) => void;
}

export default function BasicInfoStep({ data, setData }: BasicInfoStepProps) {
  const aiModels = [
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'claude-opus', label: 'Claude Opus' },
    { value: 'llama-2', label: 'Llama 2' },
  ];

  const languages = [
    { value: 'en', label: 'English' },

    { value: 'id', label: 'Indonesian' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="name" className="text-base font-semibold mb-2 block">
          Chatbot Name
        </Label>
        <Input
          id="name"
          placeholder="e.g., Customer Support Assistant"
          value={data.name}
          onChange={(e) => setData({ ...data, name: e.target.value })}
          className="text-base h-10 bg-input border-border"
        />
        <p className="text-xs text-muted-foreground mt-1">Choose a unique name for your chatbot</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="model" className="text-base font-semibold mb-2 block">
            AI Model
          </Label>
          <Select value={data.model} disabled>
            <SelectTrigger id="model" className="bg-muted border-border h-10 cursor-not-allowed opacity-60">
              <SelectValue>Gemini</SelectValue>
            </SelectTrigger>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">Default AI model (cannot be changed)</p>
        </div>

        <div>
          <Label htmlFor="language" className="text-base font-semibold mb-2 block">
            Default Language
          </Label>
          <Select value={data.language} onValueChange={(value) => setData({ ...data, language: value })}>
            <SelectTrigger id="language" className="bg-input border-border h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">Chatbot will respond in this language</p>
        </div>
      </div>

      <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border">
        <div className="flex items-center gap-3 flex-1">
          <input
            type="checkbox"
            id="public"
            checked={data.isPublic}
            onChange={(e) => setData({ ...data, isPublic: e.target.checked })}
            className="w-5 h-5 rounded cursor-pointer"
          />
          <Label htmlFor="public" className="cursor-pointer font-semibold flex-1">
            Make Chatbot Public
          </Label>
        </div>
        <span className="text-xs text-muted-foreground">Anyone can access</span>
      </div>

      <div>
        <Label htmlFor="personality" className="text-base font-semibold mb-2 block">
          Personality & System Prompt
        </Label>
        <textarea
          id="personality"
          placeholder="e.g., You are a helpful customer support representative for an online store. Be friendly, professional, and always try to resolve issues quickly."
          value={data.personality}
          onChange={(e) => setData({ ...data, personality: e.target.value })}
          className="w-full min-h-32 p-3 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground/70 placeholder:font-normal text-base"
        />
        <p className="text-xs text-muted-foreground mt-1">Define how your chatbot should behave and respond</p>
      </div>
    </div>
  );
}
