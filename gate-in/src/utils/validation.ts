export const LICENSE_PLATE_REGEX = /^[A-Z0-9]{1,10}$/;

export const validateLicensePlate = (plate: string): boolean => {
  return LICENSE_PLATE_REGEX.test(plate.toUpperCase());
};

export const formatLicensePlate = (plate: string): string => {
  return plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
}; 