import {
    Consumer,
    EachMessagePayload,
    Kafka,
    KafkaConfig,
    Partitioners,
    Producer,
} from "kafkajs";
import { MessageBroker } from "../types/broker";
import logger from "./logger";
import { KafKaTopic } from "../constants";
import { projectHandler } from "../handlers/projectHandler";
import { userHandler } from "../handlers/useHandler";
import { Config } from ".";

export class KafkaBroker implements MessageBroker {
    private consumer: Consumer;
    private producer: Producer;

    constructor(clientId: string, brokers: string[]) {
        let kafkaConfig: KafkaConfig = {
            clientId,
            brokers,
        };

        if (process.env.NODE_ENV === "production") {
            kafkaConfig = {
                ...kafkaConfig,
                ssl: true,
                connectionTimeout: 45000,
                sasl: {
                    mechanism: "plain",
                    username: Config.KAFKA_SASL_USER_NAME!,
                    password: Config.KAFKA_SASL_PASSWORD!,
                },
            };
        }

        const kafka = new Kafka(kafkaConfig);

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
                        await userHandler(
                            message.value ? message.value.toString() : "",
                        );
                        return;

                    case KafKaTopic.Subscription:
                        await projectHandler(
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
