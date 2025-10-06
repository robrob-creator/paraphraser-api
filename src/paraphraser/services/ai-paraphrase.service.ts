import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class AIParaphraseService {
  private readonly logger = new Logger(AIParaphraseService.name);
  private readonly pythonScriptPath = path.join(
    process.cwd(),
    'scripts',
    'paraphrase_model.py',
  );
  private readonly pythonExecutable = this.getPythonExecutable();

  private getPythonExecutable(): string {
    // Check if we're in a production environment (Render, Railway, etc.)
    if (process.env.NODE_ENV === 'production') {
      // In production, use system python3 (dependencies installed with --user)
      return 'python3';
    }

    // In development, try virtual environment first, fallback to system python
    const venvPython = path.join(process.cwd(), '.venv', 'bin', 'python');
    if (fs.existsSync(venvPython)) {
      return venvPython;
    }

    return 'python3';
  }

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

      // Set timeout to handle AI model loading
      setTimeout(() => {
        python.kill();
        reject(new Error('Python script timeout'));
      }, 20000); // 20 second timeout for AI models
    });
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Check if transformers is available
      const python = spawn(this.pythonExecutable, ['-c', 'import transformers; print("OK")']);

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

        // Quick timeout
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
