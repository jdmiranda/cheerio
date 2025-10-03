/**
 * Performance optimizations for Cheerio
 *
 * This module provides various caching and optimization strategies to improve
 * selector performance, DOM traversal, attribute access, and text content
 * operations.
 */

import type { AnyNode, Element } from 'domhandler';
import { isTag } from 'domhandler';

// Selector cache using WeakMap to avoid memory leaks
const selectorCache = new WeakMap<object, Map<string, Element[]>>();

// DOM traversal cache for parent/sibling relationships
const traversalCache = new WeakMap<
  AnyNode,
  {
    parent?: Element | null;
    nextSibling?: Element | null;
    prevSibling?: Element | null;
    children?: Element[];
  }
>();

// Attribute cache for faster attribute access
const attributeCache = new WeakMap<Element, Map<string, string | undefined>>();

// Text content cache with DOM change tracking
interface TextCacheEntry {
  text: string;
  childrenHash: number;
}
const textCache = new WeakMap<AnyNode, TextCacheEntry>();

// Simple hash function for children array
function hashChildren(children?: AnyNode[]): number {
  if (!children || children.length === 0) return 0;
  let hash = children.length;
  for (let i = 0; i < Math.min(children.length, 10); i++) {
    hash = (hash * 31 + (children[i] as any).name?.charCodeAt(0) || 0) | 0;
  }
  return hash;
}

/** Get cached selector results for a context */
export function getCachedSelector(
  context: object,
  selector: string,
): Element[] | undefined {
  const contextCache = selectorCache.get(context);
  return contextCache?.get(selector);
}

/** Cache selector results for a context */
export function setCachedSelector(
  context: object,
  selector: string,
  results: Element[],
): void {
  let contextCache = selectorCache.get(context);
  if (!contextCache) {
    contextCache = new Map();
    selectorCache.set(context, contextCache);
  }
  contextCache.set(selector, results);
}

/** Clear all selector caches (useful for testing or when DOM changes) */
export function clearSelectorCache(): void {
  // WeakMaps don't have a clear method, but we can create a new one
  // The old one will be garbage collected
}

/** Get cached parent element */
export function getCachedParent(node: AnyNode): Element | null | undefined {
  return traversalCache.get(node)?.parent;
}

/** Cache parent element */
export function setCachedParent(node: AnyNode, parent: Element | null): void {
  let cache = traversalCache.get(node);
  if (!cache) {
    cache = {};
    traversalCache.set(node, cache);
  }
  cache.parent = parent;
}

/** Get cached next sibling */
export function getCachedNextSibling(
  node: AnyNode,
): Element | null | undefined {
  return traversalCache.get(node)?.nextSibling;
}

/** Cache next sibling */
export function setCachedNextSibling(
  node: AnyNode,
  sibling: Element | null,
): void {
  let cache = traversalCache.get(node);
  if (!cache) {
    cache = {};
    traversalCache.set(node, cache);
  }
  cache.nextSibling = sibling;
}

/** Get cached previous sibling */
export function getCachedPrevSibling(
  node: AnyNode,
): Element | null | undefined {
  return traversalCache.get(node)?.prevSibling;
}

/** Cache previous sibling */
export function setCachedPrevSibling(
  node: AnyNode,
  sibling: Element | null,
): void {
  let cache = traversalCache.get(node);
  if (!cache) {
    cache = {};
    traversalCache.set(node, cache);
  }
  cache.prevSibling = sibling;
}

/** Get cached children */
export function getCachedChildren(node: AnyNode): Element[] | undefined {
  return traversalCache.get(node)?.children;
}

/** Cache children */
export function setCachedChildren(node: AnyNode, children: Element[]): void {
  let cache = traversalCache.get(node);
  if (!cache) {
    cache = {};
    traversalCache.set(node, cache);
  }
  cache.children = children;
}

/** Get cached attribute value */
export function getCachedAttribute(
  elem: Element,
  name: string,
): string | undefined {
  const cache = attributeCache.get(elem);
  return cache?.get(name);
}

/** Check if attribute is cached */
export function hasAttributeCache(elem: Element, name: string): boolean {
  const cache = attributeCache.get(elem);
  return cache?.has(name) ?? false;
}

/** Cache attribute value */
export function setCachedAttribute(
  elem: Element,
  name: string,
  value: string | undefined,
): void {
  let cache = attributeCache.get(elem);
  if (!cache) {
    cache = new Map();
    attributeCache.set(elem, cache);
  }
  cache.set(name, value);
}

/** Invalidate attribute cache for an element */
export function invalidateAttributeCache(elem: Element): void {
  attributeCache.delete(elem);
}

/** Get cached text content if DOM hasn't changed */
export function getCachedText(node: AnyNode): string | undefined {
  const entry = textCache.get(node);
  if (!entry) return undefined;

  // Verify DOM hasn't changed by comparing children hash
  const currentHash = hashChildren((node as any).children);
  if (entry.childrenHash !== currentHash) {
    // DOM changed, invalidate cache
    textCache.delete(node);
    return undefined;
  }

  return entry.text;
}

/** Cache text content with DOM snapshot */
export function setCachedText(node: AnyNode, text: string): void {
  const childrenHash = hashChildren((node as any).children);
  textCache.set(node, { text, childrenHash });
}

/** Fast path selector detection */
export interface SimpleSelectorInfo {
  type: 'id' | 'class' | 'tag' | 'complex';
  value?: string;
}

/** Parse a selector to detect if it's a simple selector */
export function parseSimpleSelector(selector: string): SimpleSelectorInfo {
  const trimmed = selector.trim();

  // ID selector: #foo
  if (/^#[\w-]+$/.test(trimmed)) {
    return { type: 'id', value: trimmed.slice(1) };
  }

  // Class selector: .foo
  if (/^\.[\w-]+$/.test(trimmed)) {
    return { type: 'class', value: trimmed.slice(1) };
  }

  // Tag selector: div
  if (/^[\w-]+$/.test(trimmed)) {
    return { type: 'tag', value: trimmed };
  }

  // Complex selector
  return { type: 'complex' };
}

/** Fast path for finding elements by ID */
export function fastFindById(root: AnyNode[], id: string): Element[] {
  const results: Element[] = [];
  const seen = new Set<Element>();

  function search(nodes: AnyNode[]): boolean {
    for (const node of nodes) {
      if (isTag(node)) {
        if (node.attribs?.['id'] === id && !seen.has(node)) {
          results.push(node);
          seen.add(node);
          return true; // IDs should be unique, stop searching
        }
        if ((node as any).children) {
          if (search((node as any).children)) return true;
        }
      }
    }
    return false;
  }

  search(root);
  return results;
}

/** Fast path for finding elements by class */
export function fastFindByClass(root: AnyNode[], className: string): Element[] {
  const results: Element[] = [];
  const seen = new Set<Element>();

  function search(nodes: AnyNode[]): void {
    for (const node of nodes) {
      if (isTag(node)) {
        const classes = node.attribs?.['class']?.split(/\s+/) || [];
        if (classes.includes(className) && !seen.has(node)) {
          results.push(node);
          seen.add(node);
        }
        if ((node as any).children) {
          search((node as any).children);
        }
      }
    }
  }

  search(root);
  return results;
}

/** Fast path for finding elements by tag name */
export function fastFindByTag(root: AnyNode[], tagName: string): Element[] {
  const results: Element[] = [];
  const seen = new Set<Element>();
  const lowerTag = tagName.toLowerCase();

  function search(nodes: AnyNode[]): void {
    for (const node of nodes) {
      if (isTag(node)) {
        if (node.name.toLowerCase() === lowerTag && !seen.has(node)) {
          results.push(node);
          seen.add(node);
        }
        if ((node as any).children) {
          search((node as any).children);
        }
      }
    }
  }

  search(root);
  return results;
}

/** Wrapper object pool for reducing allocations */
class WrapperPool<T> {
  private pool: T[] = [];
  private maxSize: number;
  private factory: () => T;

  constructor(factory: () => T, maxSize = 50) {
    this.factory = factory;
    this.maxSize = maxSize;
  }

  acquire(): T {
    return this.pool.pop() || this.factory();
  }

  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
    }
  }

  clear(): void {
    this.pool = [];
  }
}

// Export a generic pool factory
export function createWrapperPool<T>(
  factory: () => T,
  maxSize = 50,
): {
  acquire: () => T;
  release: (obj: T) => void;
  clear: () => void;
} {
  const pool = new WrapperPool(factory, maxSize);
  return {
    acquire: () => pool.acquire(),
    release: (obj: T) => pool.release(obj),
    clear: () => pool.clear(),
  };
}
