import {NextFunction, Request, Response} from 'express';
import {streamText} from 'ai';
import {openai} from '@ai-sdk/openai';

export class Vercel {
  private static createChatBody(body: Request['body']) {
    // Convert Deep Chat message format to Vercel AI SDK format
    return body.messages.map((message: {role: string; text: string}) => ({
      role: message.role === 'ai' ? 'assistant' : message.role,
      content: message.text,
    }));
  }

  public static async chat(body: Request['body'], res: Response, next: NextFunction) {
    try {
      const messages = Vercel.createChatBody(body);
      const result = await streamText({
        model: openai(body.model || 'gpt-3.5-turbo'),
        messages: messages,
      });

      // Send the full response back to Deep Chat
      const fullText = await result.text;
      res.json({text: fullText});
    } catch (error) {
      next(error);
    }
  }

  public static async chatStream(body: Request['body'], res: Response, next: NextFunction) {
    try {
      const messages = Vercel.createChatBody(body);
      const result = await streamText({
        model: openai(body.model || 'gpt-3.5-turbo'),
        messages: messages,
      });

      // Set up Server-Sent Events
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });

      // Stream the response
      for await (const chunk of result.textStream) {
        res.write(`data: ${JSON.stringify({text: chunk})}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      next(error);
    }
  }
}
