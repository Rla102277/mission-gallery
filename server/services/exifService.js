import exifr from 'exifr';
import fs from 'fs';

export async function extractExifData(filePath) {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('⚠️ File not found for EXIF extraction:', filePath);
      return null;
    }

    // Extract EXIF data
    const exifData = await exifr.parse(filePath, {
      tiff: true,
      exif: true,
      gps: true,
      interop: true,
      ifd0: true,
      ifd1: true,
    });

    if (!exifData) {
      console.log('ℹ️ No EXIF data found in image');
      return null;
    }

    // Extract and format the data
    const result = {
      camera: formatCamera(exifData),
      lens: formatLens(exifData),
      focalLength: formatFocalLength(exifData),
      aperture: formatAperture(exifData),
      shutterSpeed: formatShutterSpeed(exifData),
      iso: exifData.ISO || exifData.ISOSpeedRatings,
      exposureCompensation: formatExposureCompensation(exifData),
      dateTime: exifData.DateTimeOriginal || exifData.DateTime,
      gps: extractGPS(exifData),
    };

    console.log('✅ EXIF data extracted:', {
      camera: result.camera,
      lens: result.lens,
      iso: result.iso,
      hasGPS: !!result.gps
    });

    return result;
  } catch (error) {
    console.error('❌ Error extracting EXIF data:', error.message);
    return null;
  }
}

function formatCamera(exif) {
  if (exif.Make && exif.Model) {
    // Remove make from model if it's duplicated
    const model = exif.Model.replace(exif.Make, '').trim();
    return `${exif.Make} ${model}`;
  }
  return exif.Model || exif.Make || null;
}

function formatLens(exif) {
  return exif.LensModel || exif.LensInfo || exif.Lens || null;
}

function formatFocalLength(exif) {
  if (exif.FocalLength) {
    return `${Math.round(exif.FocalLength)}mm`;
  }
  return null;
}

function formatAperture(exif) {
  if (exif.FNumber) {
    return `f/${exif.FNumber}`;
  }
  if (exif.ApertureValue) {
    const fNumber = Math.pow(2, exif.ApertureValue / 2);
    return `f/${fNumber.toFixed(1)}`;
  }
  return null;
}

function formatShutterSpeed(exif) {
  if (exif.ExposureTime) {
    if (exif.ExposureTime < 1) {
      return `1/${Math.round(1 / exif.ExposureTime)}s`;
    }
    return `${exif.ExposureTime}s`;
  }
  if (exif.ShutterSpeedValue) {
    const speed = Math.pow(2, -exif.ShutterSpeedValue);
    if (speed < 1) {
      return `1/${Math.round(1 / speed)}s`;
    }
    return `${speed.toFixed(1)}s`;
  }
  return null;
}

function formatExposureCompensation(exif) {
  if (exif.ExposureCompensation !== undefined && exif.ExposureCompensation !== 0) {
    const ev = exif.ExposureCompensation;
    return `${ev > 0 ? '+' : ''}${ev.toFixed(1)} EV`;
  }
  return null;
}

function extractGPS(exif) {
  if (exif.latitude && exif.longitude) {
    return {
      latitude: exif.latitude,
      longitude: exif.longitude,
      altitude: exif.GPSAltitude || null,
    };
  }
  return null;
}

// Reverse geocode GPS coordinates to location name
export async function reverseGeocode(latitude, longitude) {
  try {
    // Using OpenStreetMap Nominatim (free, no API key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
      {
        headers: {
          'User-Agent': 'MissionGallery/1.0'
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    // Format location nicely
    const parts = [];
    if (data.address.city) parts.push(data.address.city);
    else if (data.address.town) parts.push(data.address.town);
    else if (data.address.village) parts.push(data.address.village);
    
    if (data.address.state) parts.push(data.address.state);
    if (data.address.country) parts.push(data.address.country);
    
    return parts.join(', ') || null;
  } catch (error) {
    console.error('Error reverse geocoding:', error.message);
    return null;
  }
}
