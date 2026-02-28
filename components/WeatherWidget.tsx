"use client";

import React, { useState, useEffect } from "react";
import {
    SunIcon,
    MoonIcon,
    CloudyIcon,
    RainIcon,
    StormIcon,
    CloudSunIcon,
    CloudMoonIcon,
    DrizzleIcon,
    SnowIcon,
    FogIcon
} from "./WeatherIcons";
import { Skeleton } from "./ui/skeleton";

interface WeatherData {
    temp: number;
    condition: string;
    icon: React.ReactNode;
    city: string;
}

export const WeatherWidget = () => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchWeather = async (lat: number, lon: number) => {
            try {
                // Fetch weather data
                const weatherPromise = fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
                ).then(res => res.json());

                // Fetch city name (Reverse Geocoding)
                const geoPromise = fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=12`,
                    {
                        headers: {
                            'Accept-Language': 'pt-BR',
                            'User-Agent': 'ControleFinanceiroApp/1.0'
                        }
                    }
                ).then(res => res.json());

                const [weatherData, geoData] = await Promise.all([weatherPromise, geoPromise]);

                const current = weatherData.current_weather;
                const addr = geoData.address;

                // Priority mapping for Brazilian state abbreviations
                const stateMap: Record<string, string> = {
                    'Acre': 'AC', 'Alagoas': 'AL', 'Amapá': 'AP', 'Amazonas': 'AM',
                    'Bahia': 'BA', 'Ceará': 'CE', 'Distrito Federal': 'DF',
                    'Espírito Santo': 'ES', 'Goiás': 'GO', 'Maranhão': 'MA',
                    'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS',
                    'Minas Gerais': 'MG', 'Pará': 'PA', 'Paraíba': 'PB',
                    'Paraná': 'PR', 'Pernambuco': 'PE', 'Piauí': 'PI',
                    'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN',
                    'Rio Grande do Sul': 'RS', 'Rondônia': 'RO', 'Roraima': 'RR',
                    'Santa Catarina': 'SC', 'São Paulo': 'SP', 'Sergipe': 'SE',
                    'Tocantins': 'TO'
                };

                // Specialized extraction for Brazil (Municipality vs District vs Suburb)
                const state = addr?.state || "";
                const stateAbbr = stateMap[state] || addr?.state_code || "";

                // Priority: City/Town/Municipality names
                let finalCity = addr?.city || addr?.town || addr?.municipality || addr?.village;

                // Handle Distrito Federal (Districts are usually what people recognize as "city" there)
                if (state === "Distrito Federal") {
                    finalCity = addr?.city || addr?.suburb || "Brasília";
                }
                // Fallback to suburb/district only if no municipality found
                else if (!finalCity) {
                    finalCity = addr?.suburb || addr?.city_district || "Sua Localização";
                }

                const cityLabel = stateAbbr ? `${finalCity}-${stateAbbr}` : finalCity;

                // Mapeamento de códigos de clima Open-Meteo
                const code = current.weathercode;
                let condition = "Limpo";

                const hour = new Date().getHours();
                const isNight = hour < 6 || hour > 18;
                let icon = isNight ? <MoonIcon /> : <SunIcon />;

                if (code === 0) {
                    condition = isNight ? "Céu Limpo" : "Ensolarado";
                    icon = isNight ? <MoonIcon /> : <SunIcon />;
                } else if (code >= 1 && code <= 2) {
                    condition = "Parcialmente Nublado";
                    icon = isNight ? <CloudMoonIcon /> : <CloudSunIcon />;
                } else if (code === 3) {
                    condition = "Nublado";
                    icon = <CloudyIcon />;
                } else if (code >= 45 && code <= 48) {
                    condition = "Nevoeiro";
                    icon = <FogIcon />;
                } else if (code >= 51 && code <= 55) {
                    condition = "Chuvisco";
                    icon = <DrizzleIcon />;
                } else if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
                    condition = "Chuva";
                    icon = <RainIcon />;
                } else if (code >= 71 && code <= 77) {
                    condition = "Neve";
                    icon = <SnowIcon />;
                } else if (code >= 95) {
                    condition = "Tempestade";
                    icon = <StormIcon />;
                }

                setWeather({
                    temp: Math.round(current.temperature),
                    condition,
                    icon,
                    city: cityLabel,
                });
            } catch (err) {
                console.error("Erro ao buscar clima ou cidade:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        const getLocationByIP = async () => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                // Prioritize ipapi.co (reliable for Brazil)
                const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
                clearTimeout(timeoutId);

                if (!res.ok) throw new Error('IP Geolocation error');

                const data = await res.json();
                if (data.latitude && data.longitude) {
                    fetchWeather(data.latitude, data.longitude);
                } else {
                    throw new Error('Invalid IP data');
                }
            } catch (err) {
                console.warn("Geolocation fallback (SP):", err);
                // Fallback to a major national hub if everything fails
                fetchWeather(-23.5505, -46.6333);
            }
        };

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    fetchWeather(position.coords.latitude, position.coords.longitude);
                },
                () => {
                    // Silently fallback to IP-based location
                    getLocationByIP();
                },
                { timeout: 5000, enableHighAccuracy: true }
            );
        } else {
            getLocationByIP();
        }
    }, []);

    if (loading) return <Skeleton className="h-6 w-20 bg-muted/50 rounded-full" />;
    if (error || !weather) return null;

    return (
        <div className="flex items-center gap-3 md:gap-2 bg-background/30 backdrop-blur-sm px-3 md:px-2.5 py-1.5 md:py-1 rounded-xl border border-white/5 transition-all hover:bg-background/50 group">
            <div className="w-5 h-5 md:w-5 md:h-5 drop-shadow-sm">
                {weather.icon}
            </div>
            <div className="flex flex-col leading-none">
                <div className="flex items-baseline gap-1.5 md:gap-1">
                    <span className="text-xs md:text-sm font-bold text-foreground">
                        {weather.temp}°C
                    </span>
                    <span className="text-[9px] md:text-[10px] text-muted-foreground font-medium truncate max-w-[80px] md:max-w-[100px]">
                        {weather.city}
                    </span>
                </div>
                <span className="text-[8px] md:text-[8px] text-muted-foreground/70 font-semibold uppercase tracking-wider">
                    {weather.condition}
                </span>
            </div>
        </div>
    );
};
