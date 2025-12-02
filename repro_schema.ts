
import { z } from "zod";

const ID = z.number().int().positive();
const Name = z.string().trim().min(1).max(255).nullish();
const LocalId = z.string().trim().min(1).max(255).nullish();
const Image = z.string().trim().min(1).max(255).nullish();
const Status = z.enum([
  "starting",
  "running",
  "stopped",
  "failed",
]);
const CreatedAt = z.date().nullish();
const UpdatedAt = z.date().nullish();

const ContainerEntitySchema = z.object({
  id: ID,
  name: Name,
  localId: LocalId,
  image: Image,
  status: Status,
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
});

const ContainerCreateSchema = ContainerEntitySchema.pick({
  name: true,
  localId: true,
  image: true,
}).partial();

const input = {
  name: "test-container",
  localId: "docker-123",
  image: "ubuntu:latest",
};

try {
  const result = ContainerCreateSchema.parse(input);
  console.log("Validation successful:", result);
} catch (error) {
  console.error("Validation failed:", error);
}

// Check if 'id' is in the schema
console.log("Schema shape keys:", Object.keys(ContainerCreateSchema.shape));
