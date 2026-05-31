// src/util/slugify.ts
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^a-z0-9\-]+/g, '') // Remove all non-alphanumeric chars except -
    .replace(/\-\-+/g, '-') // Collapse multiple -
    .replace(/^\-+/, '') // Trim - from start
    .replace(/\-+$/,''); // Trim - from end
}
