interface SmugMugResponse<T> {
  Response: {
    Album?: T;
    AlbumImage?: T;
    User?: T;
    Albums?: T;
    AlbumImages?: T;
  };
}

interface SmugMugAlbum {
  AlbumKey: string;
  Name: string;
  ImageCount: number;
  UrlPath: string;
  Uris: {
    AlbumImages: {
      Uri: string;
    };
  };
}

interface SmugMugImage {
  ImageKey: string;
  FileName: string;
  Title: string;
  Caption: string;
  WebUri: string;
  ThumbnailUrl: string;
  ArchivedUri?: string;
  OriginalUrl?: string;
  ImageSizeDetails?: {
    ImageSizeMedium?: {
      Url: string;
      Width: number;
      Height: number;
    };
    ImageSizeLarge?: {
      Url: string;
      Width: number;
      Height: number;
    };
    ImageSizeXLarge?: {
      Url: string;
      Width: number;
      Height: number;
    };
    ImageSizeX2Large?: {
      Url: string;
      Width: number;
      Height: number;
    };
    ImageSizeX3Large?: {
      Url: string;
      Width: number;
      Height: number;
    };
  };
}

interface Album {
  albumKey: string;
  title: string;
  imageCount: number;
}

interface Image {
  imageKey: string;
  filename: string;
  title: string;
  caption: string;
  webUri: string;
  sizes: {
    medium?: string;
    large?: string;
    xlarge?: string;
    x2large?: string;
  };
}

const API_KEY = process.env.SMUGMUG_API_KEY;
const NICKNAME = process.env.SMUGMUG_NICKNAME;
const BASE_URL = "https://api.smugmug.com";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const cache = new Map<string, { data: any; timestamp: number }>();

function getFromCache<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

async function smugmugFetch<T>(url: string): Promise<T> {
  const fullUrl = `${BASE_URL}${url}?APIKey=${API_KEY}`;
  const response = await fetch(fullUrl, {
    headers: {
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`SmugMug API error: ${response.status} ${response.statusText}`);
  }
  const rawData = await response.json();
  const data = rawData as SmugMugResponse<T>;
  return data.Response as T;
}

export async function getAlbums(): Promise<Album[]> {
  const cacheKey = "albums";
  const cached = getFromCache<Album[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const userResponse = await smugmugFetch<any>(`/api/v2/user/${NICKNAME}`);
  const user = userResponse.User;
  
  if (!user.Uris || !user.Uris.UserAlbums) {
    throw new Error("Invalid user response structure from SmugMug");
  }
  
  const albumsResponse = await smugmugFetch<any>(
    user.Uris.UserAlbums.Uri
  );
  const albums = albumsResponse.Album;

  const result: Album[] = albums.map((album: SmugMugAlbum) => ({
    albumKey: album.AlbumKey,
    title: album.Name,
    imageCount: album.ImageCount,
  }));

  setCache(cacheKey, result);
  return result;
}

export async function getAlbumImages(albumKey: string): Promise<Image[]> {
  const cacheKey = `album:${albumKey}`;
  const cached = getFromCache<Image[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // The !images endpoint returns images directly
  const imagesResponse = await smugmugFetch<any>(
    `/api/v2/album/${albumKey}!images`
  );
  
  const images = imagesResponse.AlbumImage;

  // Helper to swap size token in both path segment and filename suffix
  const swap = (url: string, size: string): string => {
    return url.replace(/\/Th\//, `/${size}/`).replace(/-Th\.(jpe?g|png)$/i, `-${size}.$1`);
  };

  const result: Image[] = images.map((img: SmugMugImage) => {
    const thumbUrl = img.ThumbnailUrl;
    return {
      imageKey: img.ImageKey,
      filename: img.FileName,
      title: img.Title,
      caption: img.Caption,
      webUri: img.WebUri, // keep as-is, this is the Buy link
      thumb: thumbUrl, // for admin picker thumbnails
      sizes: {
        medium: swap(thumbUrl, 'M'),
        large: swap(thumbUrl, 'L'),
        xlarge: swap(thumbUrl, 'XL'),
        x2large: swap(thumbUrl, 'X2'),
      },
    };
  });

  setCache(cacheKey, result);
  return result;
}
