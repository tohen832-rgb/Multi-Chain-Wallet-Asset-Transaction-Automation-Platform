import amqplib, { Channel, ChannelModel } from 'amqplib';
import { env } from './env';
import { logger } from './logger';
let connection: ChannelModel;
let channel: Channel;
export async function connectRabbitMQ() {
  connection = await amqplib.connect(env.rabbitmqUrl);
  channel = await connection.createChannel();
  await channel.assertExchange('treasury.events', 'topic', { durable: true });
  logger.info('RabbitMQ connected');
}
export function getChannel(): Channel {
  if (!channel) throw new Error('RabbitMQ not connected');
  return channel;
}
