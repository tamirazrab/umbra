#!/usr/bin/env bun

import { glob } from "glob";
import { readFileSync, writeFileSync } from "node:fs";

const files = await glob("src/**/*.spec.ts", { absolute: true });

console.log(`Found ${files.length} test files to update`);

for (const file of files) {
  let content = readFileSync(file, "utf-8");

  // Replace TestMock class import with functional imports
  content = content.replace(
    /import { TestMock } from "test\/mock";/g,
    'import { mockFn, mockResolvedValue, mockRejectedValue, mockReturnValue, mockImplementation, mockUser, mockTracing } from "test/mock";'
  );

  // Replace static method calls
  content = content.replace(/TestMock\.mock\(\)/g, "mockFn()");
  content = content.replace(/TestMock\.mockResolvedValue</g, "mockResolvedValue<");
  content = content.replace(/TestMock\.mockResolvedValue\(/g, "mockResolvedValue(");
  content = content.replace(/TestMock\.mockRejectedValue\(/g, "mockRejectedValue(");
  content = content.replace(/TestMock\.mockReturnValue</g, "mockReturnValue<");
  content = content.replace(/TestMock\.mockReturnValue\(/g, "mockReturnValue(");
  content = content.replace(/TestMock\.mockImplementation</g, "mockImplementation<");
  content = content.replace(/TestMock\.mockImplementation\(/g, "mockImplementation(");

  // Replace the non-existent methods with actual ones
  content = content.replace(/TestMock\.getMockUser\(\)/g, "mockUser()");
  content = content.replace(/TestMock\.getMockTracing\(\)/g, "mockTracing()");

  writeFileSync(file, content, "utf-8");
  console.log(`Updated: ${file}`);
}

console.log("\\nAll test files updated successfully!");
