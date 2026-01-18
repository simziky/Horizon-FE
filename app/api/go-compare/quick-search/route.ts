import { NextRequest, NextResponse } from 'next/server';
//import { QuickSearchResponse } from '@/types/goCompare';

// Mock data based on the sample response provided
const mockQuickSearchData = {
    status: 200,
    message: "success",
    data: [
        {
            store_name: "Walmart.ca",
            product_name: "Luzkey 360 Degree Phone Mount Bikes Flexible Rotatable For Cycling Bike Fits Most Phones Black Other",
            asin: "B0FF59YZFR",
            price: "$11.99",
            currency: "USD",
            country: "canada",
            product_url: "",
            image_url: "data:image/webp;base64,UklGRlBbAABXRUJQVlA4IERbAACQ3wGdASqZAr0CPj0ejESiIaESiUTwIAPEtLdwuT89uQHdj4jfM/K983/n/9P4l/m/27+z/M3/Ee67/x+S/rzzJ/l34H/af3r95Pyx+/n+B4U/sn9B/0vUU/Nf7J/o/zB/L374oMnkz8P9oPYa76/8j/Hfkx8OH53/i9NftD/5vcG/p39q/53+H9zPEF/M+oj/WP9n6OX/r/tvUt9a/+n/VfAp/P/7r/zP8J7dXtO9KgjHv0fASGNA35Y9+j4CQxoG/LHv0fASGNA35Y9+j4CQxoG/LHv0fASGNA35Y9+j4CQxoG/LHvuoUe08rG9856AlJTt9yhsBmlQwIH0dRXjLxxSMyMz5tdcd2LDZY8DXlEjuqS/0rvRh1k4VAulPMDdJ7QBzqoRxHp/BfeCOhmKZyRqh0Yu8i6ds1+xf0dYaehxPJLjYhMJUDuqtv/8c+eoWD7v4QT8pjZrsivFDo5CHmTbTWRLW8ojNLoNEZs5nmUWMRyJbWqquVQY0QnVP8W8GRyF+8Izl7wqR+Vi7ZoOAAIhCixh1qleSAAAAAAAA=",
            created_at: "2025-08-26T23:35:47.546079Z"
        },
        {
            store_name: "BestBuy.ca",
            product_name: "Luzkey Bike Phone Mount - 360 Degree Adjustable",
            asin: "B0FF59YZFR",
            price: "$14.99",
            currency: "CAD",
            country: "canada",
            product_url: "",
            image_url: "data:image/webp;base64,UklGRlBbAABXRUJQVlA4IERbAACQ3wGdASqZAr0CPj0ejESiIaESiUTwIAPEtLdwuT89uQHdj4jfM/K983/n/9P4l/m/27+z/M3/Ee67/x+S/rzzJ/l34H/af3r95Pyx+/n+B4U/sn9B/0vUU/Nf7J/o/zB/L374oMnkz8P9oPYa76/8j/Hfkx8OH53/i9NftD/5vcG/p39q/53+H9zPEF/M+oj/WP9n6OX/r/tvUt9a/+n/VfAp/P/7r/zP8J7dXtO9KgjHv0fASGNA35Y9+j4CQxoG/LHv0fASGNA35Y9+j4CQxoG/LHv0fASGNA35Y9+j4CQxoG/LHvuoUe08rG9856AlJTt9yhsBmlQwIH0dRXjLxxSMyMz5tdcd2LDZY8DXlEjuqS/0rvRh1k4VAulPMDdJ7QBzqoRxHp/BfeCOhmKZyRqh0Yu8i6ds1+xf0dYaehxPJLjYhMJUDuqtv/8c+eoWD7v4QT8pjZrsivFDo5CHmTbTWRLW8ojNLoNEZs5nmUWMRyJbWqquVQY0QnVP8W8GRyF+8Izl7wqR+Vi7ZoOAAIhCixh1qleSAAAAAAAA=",
            created_at: "2025-08-26T23:35:48.123456Z"
        },
        {
            store_name: "Amazon.ca",
            product_name: "Luzkey 360 Degree Phone Mount for Bikes",
            asin: "B0FF59YZFR",
            price: "$13.49",
            currency: "CAD",
            country: "canada",
            product_url: "",
            image_url: "data:image/webp;base64,UklGRlBbAABXRUJQVlA4IERbAACQ3wGdASqZAr0CPj0ejESiIaESiUTwIAPEtLdwuT89uQHdj4jfM/K983/n/9P4l/m/27+z/M3/Ee67/x+S/rzzJ/l34H/af3r95Pyx+/n+B4U/sn9B/0vUU/Nf7J/o/zB/L374oMnkz8P9oPYa76/8j/Hfkx8OH53/i9NftD/5vcG/p39q/53+H9zPEF/M+oj/WP9n6OX/r/tvUt9a/+n/VfAp/P/7r/zP8J7dXtO9KgjHv0fASGNA35Y9+j4CQxoG/LHv0fASGNA35Y9+j4CQxoG/LHv0fASGNA35Y9+j4CQxoG/LHvuoUe08rG9856AlJTt9yhsBmlQwIH0dRXjLxxSMyMz5tdcd2LDZY8DXlEjuqS/0rvRh1k4VAulPMDdJ7QBzqoRxHp/BfeCOhmKZyRqh0Yu8i6ds1+xf0dYaehxPJLjYhMJUDuqtv/8c+eoWD7v4QT8pjZrsivFDo5CHmTbTWRLW8ojNLoNEZs5nmUWMRyJbWqquVQY0QnVP8W8GRyF+8Izl7wqR+Vi7ZoOAAIhCixh1qleSAAAAAAAA=",
            created_at: "2025-08-26T23:35:49.789012Z"
        }
    ],
    meta: []
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { asin_upc, marketplace_id } = body;

        if (!asin_upc || !marketplace_id) {
            return NextResponse.json(
                {
                    status: 400,
                    message: "Missing required fields: asin_upc and marketplace_id",
                    data: [],
                    meta: []
                },
                { status: 400 }
            );
        }

        // In a real implementation, you would make an API call to your backend
        // For now, we'll return mock data
        // You can modify the mock data based on marketplace_id if needed

        return NextResponse.json(mockQuickSearchData);
    } catch (error) {
        console.error('Error processing quick search request:', error);
        return NextResponse.json(
            {
                status: 500,
                message: "Internal server error",
                data: [],
                meta: []
            },
            { status: 500 }
        );
    }
}
