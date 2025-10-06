import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';

@Injectable()
export class AIParaphraseService {
  private readonly logger = new Logger(AIParaphraseService.name);
  private readonly pythonScriptPath = path.join(
    process.cwd(),
    'scripts',
    'paraphrase_model.py',
  );
  private readonly pythonExecutable = path.join(
    process.cwd(),
    '.venv',
    'bin',
    'python',
  );

  async paraphrase(
    text: string,
    style: string = 'simple',
  ): Promise<{
    paraphrasedText: string;
    confidence: number;
    alternativeVersions: string[];
  }> {
    try {
      const results = await this.callPythonScript(text, style);

      return {
        paraphrasedText: results[0] || text,
        confidence: 0.9, // T5 model typically has high confidence
        alternativeVersions: results.slice(1) || [],
      };
    } catch (error) {
      this.logger.error(
        `Error calling Python paraphrase model: ${error.message}`,
      );
      throw new Error('AI paraphrasing service temporarily unavailable');
    }
  }

  private async callPythonScript(
    text: string,
    style: string,
  ): Promise<string[]> {
    return new Promise((resolve, reject) => {
      let python;

      try {
        python = spawn(this.pythonExecutable, [
          this.pythonScriptPath,
          text,
          style,
          '3',
        ]);
      } catch (error) {
        reject(new Error(`Failed to spawn python: ${error.message}`));
        return;
      }

      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      python.on('error', (error) => {
        this.logger.error(`Python process error: ${error.message}`);
        reject(new Error(`Python execution failed: ${error.message}`));
      });

      python.on('close', (code) => {
        if (code !== 0) {
          reject(
            new Error(`Python script failed with code ${code}: ${errorOutput}`),
          );
          return;
        }

        const results = output
          .trim()
          .split('\n')
          .filter((line) => line.trim());
        resolve(results);
      });

      // Set timeout to prevent hanging
      setTimeout(() => {
        python.kill();
        reject(new Error('Python script timeout'));
      }, 30000); // 30 second timeout
    });
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Check if virtual environment Python is available and has required packages
      const python = spawn(this.pythonExecutable, [
        '-c',
        'import transformers, torch, sentencepiece; print("OK")',
      ]);

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

        // Timeout after 2 seconds (importing transformers can take a moment)
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
