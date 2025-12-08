import { AttributeValue, SpanStatus, TimeInput } from '@opentelemetry/api';
import type { BaseException } from "@/utils/exception";
import type { TracingType, UserRequest } from "@/utils/request";
import type { ZodExceptionIssue } from "@/utils/validator";
import { Span } from "@opentelemetry/sdk-trace-web";
import { Types } from "mongoose";
import { type Mock, vi } from "vitest";
import { z } from "zod";

/**
 * Creates a basic vi.fn() mock
 */
export function mockFn(): Mock {
	return vi.fn();
}

/**
 * Creates a mock function that resolves with the provided value
 */
export function mockResolvedValue<T = void>(value?: Partial<T> | null): Mock {
	return vi.fn().mockResolvedValue(value as Partial<T>);
}

/**
 * Creates a mock function that resolves once with the provided value
 */
export function mockResolvedValueOnce<T = void>(
	value?: Partial<T> | null,
): Mock {
	return vi.fn().mockResolvedValueOnce(value as Partial<T>);
}

/**
 * Creates a mock function that rejects with the provided error
 */
export function mockRejectedValue(value: BaseException): Mock {
	return vi.fn().mockRejectedValue(value);
}

/**
 * Creates a mock function that rejects once with the provided error
 */
export function mockRejectedValueOnce(value: BaseException): Mock {
	return vi.fn().mockRejectedValueOnce(value);
}

/**
 * Creates a mock function that returns the provided value
 */
export function mockReturnValue<T = void>(value?: Partial<T> | null): Mock {
	return vi.fn().mockReturnValue(value as T | null);
}

/**
 * Creates a mock function with custom implementation
 */
export function mockImplementation<T = void>(
	fn?: (...args: unknown[]) => Partial<T> | null,
): Mock {
	return vi.fn().mockImplementation(fn as (...args: unknown[]) => unknown);
}

/**
 * Helper to test Zod validation errors
 */
export async function expectZodError(
	callback: () => Promise<unknown>,
	expected: (issues: any) => void,
) {
	try {
		await callback();
	} catch (error) {
		if (error instanceof z.ZodError) {
			const issues = error.issues.map(
				({ message, path }: ZodExceptionIssue) => ({
					message,
					path: path[0],
				}),
			);
			expected(issues);
		}
	}
}

/**
 * Helper to get a property name in a type-safe way
 */
export function nameOf<T>(key: keyof T) {
	return key;
}

/**
 * Returns a test UUID
 */
export function getUUID() {
	return "9269248e-54cc-46f9-80c0-7029c989c0e3";
}

/**
 * Returns a test ObjectId
 */
export function getObjectId() {
	return new Types.ObjectId("671d15ddd0bcb68467b767d0");
}

/**
 * Returns a test date
 */
export function getDate() {
	return new Date("Sat Feb 10 2024 14:00:35");
}

/**
 * Returns a mock user for testing
 */
export function mockUser(): UserRequest {
	return {
		email: "test",
		name: "test",
		id: getUUID(),
	};
}

/**
 * Returns a mock tracing context for testing
 */
export function mockTracing() {
	return {
		tracing: {
			logEvent(key: string, value: AttributeValue | TimeInput) {
				return key + value;
			},
			setStatus(event: SpanStatus) {
				return event;
			}
		} as Partial<TracingType> as TracingType,
		user: mockUser()
	};
}
