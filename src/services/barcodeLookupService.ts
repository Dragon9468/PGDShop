// ==============================================================================
// PGDShop - Barcode Online Lookup & Auto-Cataloging Service
// Tra cứu thông tin sản phẩm tự động từ mã vạch (GS1 / Open Food Facts / VN Database)
// ==============================================================================

export interface BarcodeLookupResult {
  barcode: string;
  name: string;
  brand?: string;
  unit: string;
  category: 'TapHoa' | 'BaoBi' | 'VanPhongPham' | 'CheBien_FB';
  imageUrl?: string;
  source: 'LOCAL_DICTIONARY' | 'OPEN_FOOD_FACTS' | 'GENERATED';
}

// Từ điển mã vạch các mặt hàng bán lẻ phổ biến tại Việt Nam (Tra cứu tức thì không cần mạng)
const POPULAR_VN_BARCODES: Record<string, Partial<BarcodeLookupResult>> = {
  '8934563138164': {
    name: 'Nước Ngọt Có Ga Coca-Cola Lon 320ml',
    brand: 'Coca-Cola',
    unit: 'Lon',
    category: 'TapHoa',
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop&q=80',
  },
  '8934563138171': {
    name: 'Nước Ngọt Có Ga Pepsi Lon 320ml',
    brand: 'Pepsi',
    unit: 'Lon',
    category: 'TapHoa',
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&auto=format&fit=crop&q=80',
  },
  '8935001700018': {
    name: 'Mì Tôm Chua Cay Hảo Hảo Acecook 75g',
    brand: 'Acecook',
    unit: 'Gói',
    category: 'TapHoa',
    imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&auto=format&fit=crop&q=80',
  },
  '8934673100012': {
    name: 'Sữa Tươi Tiệt Trùng Vinamilk 100% Có Đường 220ml',
    brand: 'Vinamilk',
    unit: 'Hộp',
    category: 'TapHoa',
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80',
  },
  '8934822212345': {
    name: 'Trà Xanh Olong Tea+ Chai 455ml (Suntory)',
    brand: 'Suntory Pepsico',
    unit: 'Chai',
    category: 'TapHoa',
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&auto=format&fit=crop&q=80',
  },
  '8935049500544': {
    name: 'Nước Khoáng Thiên Nhiên La Vie Chai 500ml',
    brand: 'Nestlé La Vie',
    unit: 'Chai',
    category: 'TapHoa',
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=400&auto=format&fit=crop&q=80',
  },
  '8934804021234': {
    name: 'Cà Phê Hòa Tan G7 3in1 Hộp 18 Gói',
    brand: 'Trung Nguyên',
    unit: 'Hộp',
    category: 'TapHoa',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80',
  },
  '8934563240010': {
    name: 'Bánh Quy AFC Dinh Dưỡng Vị Rau Cải 200g',
    brand: 'Kinh Đô Mondelez',
    unit: 'Hộp',
    category: 'TapHoa',
    imageUrl: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400&auto=format&fit=crop&q=80',
  },
  '8934752010015': {
    name: 'Nước Tương Tam Thái Tử Nhất Ca Chai 500ml',
    brand: 'Masan',
    unit: 'Chai',
    category: 'TapHoa',
    imageUrl: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=400&auto=format&fit=crop&q=80',
  },
};

class BarcodeLookupService {
  /**
   * Tra cứu thông tin sản phẩm từ mã vạch (Barcode EAN-13, UPC, Code 128)
   */
  public async lookup(barcode: string): Promise<BarcodeLookupResult | null> {
    const cleanBarcode = barcode.trim();
    if (!cleanBarcode) return null;

    // 1. Kiểm tra từ điển hàng hóa phổ biến tại Việt Nam (tức thì 0ms)
    if (POPULAR_VN_BARCODES[cleanBarcode]) {
      const item = POPULAR_VN_BARCODES[cleanBarcode];
      return {
        barcode: cleanBarcode,
        name: item.name || 'Sản phẩm ' + cleanBarcode,
        brand: item.brand,
        unit: item.unit || 'Cái',
        category: (item.category as any) || 'TapHoa',
        imageUrl: item.imageUrl,
        source: 'LOCAL_DICTIONARY',
      };
    }

    // 2. Tra cứu API cơ sở dữ liệu mở Open Food Facts (Hơn 3 triệu mặt hàng có sẵn ảnh & tên tiếng Việt)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(cleanBarcode)}.json`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.status === 1 && data.product) {
          const p = data.product;
          const name = p.product_name_vi || p.product_name || p.generic_name || '';
          const brand = p.brands || '';
          const fullName = brand && !name.toLowerCase().includes(brand.toLowerCase())
            ? `${name} (${brand})`
            : name;

          const imageUrl = p.image_front_url || p.image_url || p.image_small_url || '';
          let unit = 'Cái';
          if (p.quantity) {
            if (/lon|can/i.test(p.quantity)) unit = 'Lon';
            else if (/chai|bottle/i.test(p.quantity)) unit = 'Chai';
            else if (/gói|pack/i.test(p.quantity)) unit = 'Gói';
            else if (/hộp|box/i.test(p.quantity)) unit = 'Hộp';
          }

          if (fullName) {
            return {
              barcode: cleanBarcode,
              name: fullName,
              brand,
              unit,
              category: 'TapHoa',
              imageUrl,
              source: 'OPEN_FOOD_FACTS',
            };
          }
        }
      }
    } catch (err) {
      console.warn('OpenFoodFacts lookup timed out or failed:', err);
    }

    return null;
  }
}

export const barcodeLookupService = new BarcodeLookupService();
