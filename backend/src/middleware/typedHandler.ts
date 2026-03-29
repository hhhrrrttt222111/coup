import type { RequestHandler } from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';

/**
 * Express RequestHandler with typed body, query-string, and route params.
 *
 * Usage:
 *   const handler: TypedHandler<{ name: string }, {}, { id: string }> = ...
 *   //  req.body    → { name: string }
 *   //  req.query   → {}
 *   //  req.params  → { id: string }
 */
export type TypedHandler<
  TBody = unknown,
  TQuery extends ParsedQs = ParsedQs,
  TParams extends ParamsDictionary = ParamsDictionary,
> = RequestHandler<TParams, unknown, TBody, TQuery>;
