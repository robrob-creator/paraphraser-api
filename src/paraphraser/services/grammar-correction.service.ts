import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class GrammarCorrectionService {
  private readonly logger = new Logger(GrammarCorrectionService.name);
  private readonly pythonScriptPath = path.join(
    process.cwd(),
    'scripts',
    'grammar_corrector.py',
  );
  private readonly pythonExecutable = this.getPythonExecutable();

  private getPythonExecutable(): string {
    // Check if we're in a production environment
    if (process.env.NODE_ENV === 'production') {
      return 'python3';
    }

    // In development, try virtual environment first
    const venvPython = path.join(process.cwd(), '.venv', 'bin', 'python');
    if (fs.existsSync(venvPython)) {
      return venvPython;
    }

    return 'python3';
  }

  async correctGrammar(
    text: string,
    level: 'basic' | 'advanced' = 'basic',
  ): Promise<{
    originalText: string;
    correctedText: string;
    corrections: Array<{
      original: string;
      corrected: string;
      type: string;
      confidence: number;
    }>;
    confidence: number;
  }> {
    try {
      // Check if Python script exists, if not create it
      if (!fs.existsSync(this.pythonScriptPath)) {
        await this.createGrammarCorrectorScript();
      }

      const result = await this.callPythonScript(text, level);

      return {
        originalText: text,
        correctedText: result.correctedText,
        corrections: result.corrections,
        confidence: result.confidence,
      };
    } catch (error) {
      this.logger.error(`Error in grammar correction: ${error.message}`);

      // Fallback to basic correction
      const basicCorrected = this.applyBasicGrammarFixes(text);
      return {
        originalText: text,
        correctedText: basicCorrected,
        corrections: [],
        confidence: 0.7,
      };
    }
  }

  private async callPythonScript(
    text: string,
    level: string,
  ): Promise<{
    correctedText: string;
    corrections: Array<{
      original: string;
      corrected: string;
      type: string;
      confidence: number;
    }>;
    confidence: number;
  }> {
    return new Promise((resolve, reject) => {
      const args = [this.pythonScriptPath, text, level];
      this.logger.log(
        `Calling grammar corrector with: ${JSON.stringify(args)}`,
      );

      const python = spawn(this.pythonExecutable, args);
      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      python.on('error', (error) => {
        reject(new Error(`Python execution failed: ${error.message}`));
      });

      python.on('close', (code) => {
        if (code !== 0) {
          reject(
            new Error(
              `Grammar corrector failed with code ${code}: ${errorOutput}`,
            ),
          );
          return;
        }

        try {
          const result = JSON.parse(output.trim());
          resolve(result);
        } catch (parseError) {
          reject(
            new Error(
              `Failed to parse grammar corrector output: ${parseError.message}`,
            ),
          );
        }
      });

      // Timeout
      setTimeout(() => {
        python.kill();
        reject(new Error('Grammar corrector timeout'));
      }, 10000);
    });
  }

  private applyBasicGrammarFixes(text: string): string {
    let corrected = text;

    // Fix capitalization
    if (corrected && !corrected[0]?.match(/[A-Z]/)) {
      corrected = corrected[0]?.toUpperCase() + corrected.slice(1);
    }

    // Fix common contractions
    const contractions = {
      couldnt: "couldn't",
      cant: "can't",
      dont: "don't",
      wont: "won't",
      isnt: "isn't",
      arent: "aren't",
      wasnt: "wasn't",
      werent: "weren't",
      hasnt: "hasn't",
      havent: "haven't",
      hadnt: "hadn't",
      shouldnt: "shouldn't",
      wouldnt: "wouldn't",
      mustnt: "mustn't",
    };

    for (const [wrong, right] of Object.entries(contractions)) {
      corrected = corrected.replace(new RegExp(wrong, 'gi'), right);
    }

    // Fix common subject-verb agreement
    corrected = corrected.replace(/people is/gi, 'people are');
    corrected = corrected.replace(/\bwe was\b/gi, 'we were');
    corrected = corrected.replace(/\bthey was\b/gi, 'they were');
    corrected = corrected.replace(/\byou was\b/gi, 'you were');

    // Fix double negatives
    corrected = corrected.replace(/\bnowhere\b/gi, 'anywhere');
    corrected = corrected.replace(/\bnothing\b/gi, 'anything');
    corrected = corrected.replace(/\bnobody\b/gi, 'anybody');

    // Fix pronoun order
    corrected = corrected.replace(/\bme and\b/gi, 'my friend and I');

    // Fix spacing around punctuation
    corrected = corrected.replace(/\s+,/g, ',');
    corrected = corrected.replace(/\s+\./g, '.');
    corrected = corrected.replace(/\s+!/g, '!');
    corrected = corrected.replace(/\s+\?/g, '?');

    // Ensure proper sentence ending
    if (corrected && !corrected.match(/[.!?]$/)) {
      corrected += '.';
    }

    // Fix multiple spaces
    corrected = corrected.replace(/\s{2,}/g, ' ');

    return corrected.trim();
  }

  private async createGrammarCorrectorScript(): Promise<void> {
    const scriptContent = `#!/usr/bin/env python3
"""
Grammar Corrector using AI and rule-based approaches
"""

import sys
import json
import logging
import re

# Setup logging
logging.basicConfig(level=logging.INFO)

try:
    from transformers import pipeline, T5ForConditionalGeneration, T5Tokenizer
    import torch
    HAS_TRANSFORMERS = True
except ImportError:
    HAS_TRANSFORMERS = False
    logging.warning("Transformers not available, using rule-based corrections only")

class GrammarCorrector:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        
        if HAS_TRANSFORMERS:
            try:
                # Try to load a lightweight grammar correction model
                model_name = "google/flan-t5-base"
                self.tokenizer = T5Tokenizer.from_pretrained(model_name)
                self.model = T5ForConditionalGeneration.from_pretrained(model_name)
                logging.info(f"Loaded {model_name} model successfully")
            except Exception as e:
                logging.warning(f"Failed to load AI model: {e}")
                self.model = None
                self.tokenizer = None

    def correct_grammar(self, text, level="basic"):
        """Correct grammar in the given text"""
        
        corrections = []
        confidence = 0.8
        
        if level == "advanced" and self.model and self.tokenizer:
            # Use AI model for advanced correction
            corrected_text, ai_corrections = self._ai_correct(text)
            corrections.extend(ai_corrections)
            confidence = 0.9
        else:
            # Use rule-based correction
            corrected_text, rule_corrections = self._rule_based_correct(text)
            corrections.extend(rule_corrections)
            confidence = 0.7
        
        return {
            "correctedText": corrected_text,
            "corrections": corrections,
            "confidence": confidence
        }
    
    def _ai_correct(self, text):
        """Use AI model for grammar correction"""
        corrections = []
        
        try:
            # Create correction prompt
            prompt = f"Fix any grammar errors in this sentence while keeping the meaning exactly the same: {text}"
            
            inputs = self.tokenizer(
                prompt,
                return_tensors="pt",
                max_length=512,
                truncation=True,
                padding=True
            )
            
            with torch.no_grad():
                outputs = self.model.generate(
                    inputs.input_ids,
                    max_length=len(text.split()) + 20,
                    min_length=max(1, len(text.split()) - 5),
                    num_return_sequences=1,
                    temperature=0.3,
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id,
                    no_repeat_ngram_size=3
                )
            
            corrected = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Clean up the result
            if prompt in corrected:
                corrected = corrected.replace(prompt, "").strip()
            
            # Remove common AI response patterns
            patterns = ["Here is the corrected sentence:", "Corrected:", "Fixed:", "Grammar corrected:"]
            for pattern in patterns:
                if corrected.lower().startswith(pattern.lower()):
                    corrected = corrected[len(pattern):].strip()
            
            # Validate result
            if (corrected and 
                len(corrected.split()) >= len(text.split()) * 0.7 and
                len(corrected.split()) <= len(text.split()) * 1.5):
                
                if corrected.lower() != text.lower():
                    corrections.append({
                        "original": text,
                        "corrected": corrected,
                        "type": "AI Grammar Correction",
                        "confidence": 0.9
                    })
                
                return corrected, corrections
            
        except Exception as e:
            logging.warning(f"AI correction failed: {e}")
        
        # Fallback to rule-based
        return self._rule_based_correct(text)
    
    def _rule_based_correct(self, text):
        """Apply rule-based grammar corrections"""
        corrected = text
        corrections = []
        
        # Track original for comparison
        original = corrected
        
        # Fix capitalization
        if corrected and not corrected[0].isupper():
            corrected = corrected[0].upper() + corrected[1:]
            if corrected != original:
                corrections.append({
                    "original": original,
                    "corrected": corrected,
                    "type": "Capitalization",
                    "confidence": 0.95
                })
        
        # Fix contractions
        contraction_fixes = {
            "couldnt": "couldn't",
            "cant": "can't",
            "dont": "don't",
            "wont": "won't",
            "isnt": "isn't",
            "arent": "aren't",
            "wasnt": "wasn't",
            "werent": "weren't",
            "hasnt": "hasn't",
            "havent": "haven't",
            "hadnt": "hadn't"
        }
        
        for wrong, right in contraction_fixes.items():
            if wrong in corrected.lower():
                old_corrected = corrected
                corrected = re.sub(wrong, right, corrected, flags=re.IGNORECASE)
                if corrected != old_corrected:
                    corrections.append({
                        "original": wrong,
                        "corrected": right,
                        "type": "Contraction",
                        "confidence": 0.9
                    })
        
        # Fix subject-verb agreement
        agreement_fixes = [
            ("people is", "people are"),
            ("we was", "we were"),
            ("they was", "they were"),
            ("you was", "you were")
        ]
        
        for wrong, right in agreement_fixes:
            if wrong in corrected.lower():
                old_corrected = corrected
                corrected = re.sub(wrong, right, corrected, flags=re.IGNORECASE)
                if corrected != old_corrected:
                    corrections.append({
                        "original": wrong,
                        "corrected": right,
                        "type": "Subject-Verb Agreement",
                        "confidence": 0.95
                    })
        
        # Fix double negatives
        negative_fixes = [
            ("nowhere", "anywhere"),
            ("nothing", "anything"),
            ("nobody", "anybody")
        ]
        
        for wrong, right in negative_fixes:
            if wrong in corrected.lower():
                old_corrected = corrected
                corrected = re.sub(r"\\b" + wrong + r"\\b", right, corrected, flags=re.IGNORECASE)
                if corrected != old_corrected:
                    corrections.append({
                        "original": wrong,
                        "corrected": right,
                        "type": "Double Negative",
                        "confidence": 0.85
                    })
        
        # Fix spacing and punctuation
        old_corrected = corrected
        corrected = re.sub(r'\\s+,', ',', corrected)
        corrected = re.sub(r'\\s+\\.', '.', corrected)
        corrected = re.sub(r'\\s+!', '!', corrected)
        corrected = re.sub(r'\\s+\\?', '?', corrected)
        
        if corrected != old_corrected:
            corrections.append({
                "original": "spacing issues",
                "corrected": "fixed spacing",
                "type": "Punctuation",
                "confidence": 0.8
            })
        
        # Ensure proper sentence ending
        if corrected and not corrected[-1] in '.!?':
            corrected += '.'
            corrections.append({
                "original": "missing punctuation",
                "corrected": "added period",
                "type": "Sentence Ending",
                "confidence": 0.9
            })
        
        return corrected, corrections

def main():
    if len(sys.argv) != 3:
        print("Usage: python grammar_corrector.py <text> <level>")
        sys.exit(1)
    
    text = sys.argv[1]
    level = sys.argv[2]
    
    corrector = GrammarCorrector()
    result = corrector.correct_grammar(text, level)
    
    print(json.dumps(result))

if __name__ == "__main__":
    main()
`;

    fs.writeFileSync(this.pythonScriptPath, scriptContent);
    this.logger.log('Created grammar corrector Python script');
  }

  async isAvailable(): Promise<boolean> {
    try {
      const python = spawn(this.pythonExecutable, ['-c', 'print("OK")']);

      return new Promise((resolve) => {
        let success = false;

        python.stdout.on('data', (data) => {
          if (data.toString().trim() === 'OK') {
            success = true;
          }
        });

        python.on('close', (code) => {
          resolve(success && code === 0);
        });

        python.on('error', () => {
          resolve(false);
        });

        setTimeout(() => {
          python.kill();
          resolve(false);
        }, 2000);
      });
    } catch {
      return false;
    }
  }
}
