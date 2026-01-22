import { NextResponse } from 'next/server';
import { CountryResponse } from '@/types/goCompare';

// Mock data based on the sample response provided
const countriesData: CountryResponse = {
    status: 200,
    message: "Data retrieved successfully",
    data: [
        {
            id: "united_states",
            name: "United States",
            flag: "https://flagcdn.com/h240/us.png",
            short_code: "US"
        },
        {
            id: "united_kingdom",
            name: "United Kingdom",
            flag: "https://flagcdn.com/h240/gb.png",
            short_code: "UK"
        },
        {
            id: "canada",
            name: "Canada",
            flag: "https://flagcdn.com/h240/ca.png",
            short_code: "CA"
        },
        {
            id: "australia",
            name: "Australia",
            flag: "https://flagcdn.com/h240/au.png",
            short_code: "AU"
        },
        {
            id: "germany",
            name: "Germany",
            flag: "https://flagcdn.com/h240/de.png",
            short_code: "DE"
        },
        {
            id: "france",
            name: "France",
            flag: "https://flagcdn.com/h240/fr.png",
            short_code: "FR"
        },
        {
            id: "nigeria",
            name: "Nigeria",
            flag: "https://flagcdn.com/h240/ng.png",
            short_code: "NG"
        },
        {
            id: "india",
            name: "India",
            flag: "https://flagcdn.com/h240/in.png",
            short_code: "IN"
        }
    ],
    meta: []
};

export async function GET() {
    try {
        // In a real implementation, you would fetch this data from your backend
        // For now, we'll return the mock data
        return NextResponse.json(countriesData);
    } catch (error) {
        console.error('Error fetching countries:', error);
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
