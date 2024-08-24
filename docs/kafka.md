#### KAFKA Topics

| Topic | Data                                                | Events                   |
| ----- | --------------------------------------------------- | ------------------------ |
| chat  | `{ "event_type": "CHAT_CREATE", "data": "data..."}` | CHAT_CREATE, CHAT_UPDATE |
| mail  | `{ "event_type": "", "data": "data..."}`            | ,                        |

### Create Kafka topic:

<!-- pull image: docker compose up -d -->
<!-- docker exec -it cc410de9dbb3 sh -->

./kafka-topics.sh --create --topic chat --bootstrap-server localhost:9092

./kafka-topics.sh --create --topic chat --partitions 6 --bootstrap-server localhost:9092

<!-- List Kafka topics: -->

./kafka-topics.sh --list --bootstrap-server localhost:9092

<!-- Get Topic details, partition counts etc. -->

./kafka-topics.sh --describe --bootstrap-server localhost:9092 --topic chat

<!-- Alter the topic, change partition: -->

./kafka-topics.sh --alter --bootstrap-server localhost:9092 --topic chat --partitions 6

<!-- Publish a message to Kafka topic -->

./kafka-console-producer.sh --bootstrap-server localhost:9092 --topic chat

<!-- Check messages in a topic -->

./kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic chat --from-beginning
