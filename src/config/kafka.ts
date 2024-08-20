import { Consumer, EachMessagePayload, Kafka } from "kafkajs";
import { MessageBroker } from "../types/broker";
import logger from "./logger";
import { KafKaTopic } from "../constants";
import { handleUserUpdate } from "../utils/userUpdateHandler";

export class KafkaBroker implements MessageBroker {
    private consumer: Consumer;

    constructor(clientId: string, brokers: string[]) {
        const kafka = new Kafka({ clientId, brokers });

        this.consumer = kafka.consumer({ groupId: clientId });
    }

    /**
     * Connect the consumer
     */
    async connectConsumer() {
        await this.consumer.connect();
    }

    /**
     * Disconnect the consumer
     */
    async disconnectConsumer() {
        await this.consumer.disconnect();
    }

    async consumeMessage(topics: string[], fromBeginning: boolean = false) {
        await this.consumer.subscribe({ topics, fromBeginning });

        await this.consumer.run({
            eachMessage: async ({
                topic,
                partition,
                message,
            }: EachMessagePayload) => {
                switch (topic) {
                    case KafKaTopic.User:
                        await handleUserUpdate(
                            message.value ? message.value.toString() : "",
                        );
                        return;
                    default:
                        logger.info("Doing nothing...");
                }

                logger.info({
                    value: message.value?.toString(),
                    topic,
                    partition,
                });
            },
        });
    }
}
