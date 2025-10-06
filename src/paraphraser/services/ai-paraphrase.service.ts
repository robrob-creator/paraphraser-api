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
      const python = spawn('python3', [
        this.pythonScriptPath,
        text,
        style,
        '3',
      ]);
      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
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
      await this.callPythonScript('test', 'simple');
      return true;
    } catch {
      return false;
    }
  }
}
