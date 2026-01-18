import { NextResponse } from 'next/server';

interface Category {
    id: number;
    name: string;
}

interface CategoriesResponse {
    status: number;
    message: string;
    data: Category[];
    responseCode: string;
    meta: unknown[];
}

// Mock data based on the sample response provided
const categoriesData: CategoriesResponse = {
    status: 200,
    message: "data retrieved successfully",
    data: [
        { id: 1, name: "Toys & Games" },
        { id: 2, name: "Movies & TV" },
        { id: 3, name: "Books" },
        { id: 4, name: "Baby Products" },
        { id: 5, name: "Patio, Lawn & Garden" },
        { id: 6, name: "Tools & Home Improvement" },
        { id: 7, name: "Home & Kitchen" },
        { id: 8, name: "Beauty & Personal Care" },
        { id: 9, name: "Baby" }
    ],
    responseCode: "00",
    meta: []
};

export async function GET() {
    try {
        // In a real implementation, you would fetch this data from your backend
        // For now, we'll return the mock data
        return NextResponse.json(categoriesData);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json(
            {
                status: 500,
                message: "Internal server error",
                data: [],
                responseCode: "99",
                meta: []
            },
            { status: 500 }
        );
    }
}
