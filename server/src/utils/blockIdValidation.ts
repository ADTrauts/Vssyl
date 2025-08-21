/**
 * Block ID validation utilities
 */

export interface BlockIdComponents {
  countryCode: string;
  regionCode: string;
  townCode: string;
  serialNumber: string;
}

/**
 * Validates Block ID format (3-3-3-7)
 */
export function validateBlockIdFormat(blockId: string): boolean {
  const pattern = /^\d{3}-\d{3}-\d{3}-\d{7}$/;
  return pattern.test(blockId);
}

/**
 * Parses Block ID into its components
 */
export function parseBlockId(blockId: string): BlockIdComponents | null {
  if (!validateBlockIdFormat(blockId)) {
    return null;
  }

  const parts = blockId.split('-');
  if (parts.length !== 4) {
    return null;
  }

  return {
    countryCode: parts[0],
    regionCode: parts[1],
    townCode: parts[2],
    serialNumber: parts[3]
  };
}

/**
 * Validates Block ID components
 */
export function validateBlockIdComponents(components: BlockIdComponents): boolean {
  // Check country code (should be 3 digits)
  if (!/^\d{3}$/.test(components.countryCode)) {
    return false;
  }

  // Check region code (should be 3 digits)
  if (!/^\d{3}$/.test(components.regionCode)) {
    return false;
  }

  // Check town code (should be 3 digits)
  if (!/^\d{3}$/.test(components.townCode)) {
    return false;
  }

  // Check serial number (should be 7 digits)
  if (!/^\d{7}$/.test(components.serialNumber)) {
    return false;
  }

  // Check that serial number is not all zeros
  if (components.serialNumber === '0000000') {
    return false;
  }

  return true;
}

/**
 * Validates a complete Block ID
 */
export function validateBlockId(blockId: string): boolean {
  const components = parseBlockId(blockId);
  if (!components) {
    return false;
  }

  return validateBlockIdComponents(components);
}

/**
 * Generates a test Block ID for validation
 */
export function generateTestBlockId(
  countryCode: string,
  regionCode: string,
  townCode: string,
  serialNumber: number
): string {
  const formattedCountry = countryCode.padStart(3, '0');
  const formattedRegion = regionCode.padStart(3, '0');
  const formattedTown = townCode.padStart(3, '0');
  const formattedSerial = serialNumber.toString().padStart(7, '0');

  return `${formattedCountry}-${formattedRegion}-${formattedTown}-${formattedSerial}`;
}

/**
 * Extracts location information from Block ID
 */
export function getLocationFromBlockId(blockId: string): {
  countryCode: string;
  regionCode: string;
  townCode: string;
} | null {
  const components = parseBlockId(blockId);
  if (!components) {
    return null;
  }

  return {
    countryCode: components.countryCode,
    regionCode: components.regionCode,
    townCode: components.townCode
  };
}

/**
 * Checks if two Block IDs are from the same location
 */
export function areBlockIdsFromSameLocation(blockId1: string, blockId2: string): boolean {
  const location1 = getLocationFromBlockId(blockId1);
  const location2 = getLocationFromBlockId(blockId2);

  if (!location1 || !location2) {
    return false;
  }

  return (
    location1.countryCode === location2.countryCode &&
    location1.regionCode === location2.regionCode &&
    location1.townCode === location2.townCode
  );
} 