import app from "./app";
import { Config } from "./config";
import connectDB from "./config/db";
import logger from "./config/logger";
import { KafKaTopic } from "./constants";
import { MessageBroker } from "./types/broker";
import { createMessageBroker } from "./utils/factories/brokerFactory";

const startServer = async () => {
    const PORT = Config.PORT;
    let broker: MessageBroker | null = null;

    try {
        await connectDB();

        broker = createMessageBroker();
        await broker.connectConsumer();

        await broker.consumeMessage([KafKaTopic.User], false);

        app.listen(PORT, () => logger.info(`Server listening on ${PORT}`));
    } catch (error: unknown) {
        if (error instanceof Error) {
            if (broker) {
                await broker.disconnectConsumer();
            }

            logger.error(error.message);
            process.exit(1);
        }
    }
};

void startServer();
