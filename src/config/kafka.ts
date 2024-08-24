import {
    Consumer,
    EachMessagePayload,
    Kafka,
    Partitioners,
    Producer,
} from "kafkajs";
import { MessageBroker } from "../types/broker";
import logger from "./logger";
import { KafKaTopic } from "../constants";
import { handleUserUpdate } from "../utils/userUpdateHandler";

export class KafkaBroker implements MessageBroker {
    private consumer: Consumer;
    private producer: Producer;

    constructor(clientId: string, brokers: string[]) {
        const kafka = new Kafka({ clientId, brokers });

        this.consumer = kafka.consumer({ groupId: clientId });

        // this.producer = kafka.producer();
        this.producer = kafka.producer({
            createPartitioner: Partitioners.LegacyPartitioner,
        });
    }

    /**
     * Connect the consumer
     */
    async connectConsumer() {
        await this.consumer.connect();
    }

    /**
     * Connect the producer
     */
    async connectProducer() {
        await this.producer.connect();
    }

    /**
     * Disconnect the consumer
     */
    async disconnectConsumer() {
        await this.consumer.disconnect();
    }

    /**
     * Disconnect the producer
     */
    async disconnectProducer() {
        if (this.producer) {
            await this.producer.disconnect();
        }
    }

    /**
     * @param topic - the topic to send messages to
     * @param message - the message to send
     * @throws {Error} - when the producer is not connected
     */
    async sendMessage(topic: string, message: string, key?: string) {
        const data: { value: string; key?: string } = {
            value: message,
        };

        if (key) {
            data.key = key;
        }

        await this.producer.send({
            topic,
            messages: [data],
        });
    }

    async consumeMessage(topics: string[], fromBeginning: boolean = false) {
        await this.consumer.subscribe({ topics, fromBeginning });

        await this.consumer.run({
            eachMessage: async ({
                topic,
                partition,
                message,
            }: EachMessagePayload) => {
                logger.info({
                    value: message.value?.toString(),
                    topic,
                    partition,
                });

                switch (topic) {
                    case KafKaTopic.User:
                        await handleUserUpdate(
                            message.value ? message.value.toString() : "",
                        );
                        return;
                    default:
                        logger.info("Doing nothing...");
                }
            },
        });
    }
}
