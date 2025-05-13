/**
 * Utility functions for file operations
 */

/**
 * Generate a unique name by appending a number if the name already exists
 * @param {string} baseName - Original name
 * @param {Function} checkExists - Function that checks if a name exists
 * @returns {Promise<string>} - Unique name
 */
export async function generateUniqueName(baseName, checkExists) {
  let name = baseName;
  let counter = 1;
  
  // Split name into name and extension for files
  const lastDotIndex = baseName.lastIndexOf('.');
  const nameWithoutExt = lastDotIndex !== -1 ? baseName.slice(0, lastDotIndex) : baseName;
  const extension = lastDotIndex !== -1 ? baseName.slice(lastDotIndex) : '';

  // Keep trying until we find a unique name
  while (await checkExists(name)) {
    name = `${nameWithoutExt} (${counter})${extension}`;
    counter++;
  }

  return name;
}

/**
 * Parse a filename into its base name and extension
 * @param {string} filename 
 * @returns {{ name: string, extension: string }}
 */
export function parseFileName(filename) {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return { name: filename, extension: '' };
  }
  return {
    name: filename.slice(0, lastDotIndex),
    extension: filename.slice(lastDotIndex)
  };
} 