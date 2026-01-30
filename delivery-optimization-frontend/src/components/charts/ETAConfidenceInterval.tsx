"use client";
import React from "react";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface ETAConfidenceIntervalProps {
    data: {
        time: string;
        expected: number;
        min: number;
        max: number;
    }[];
}

export default function ETAConfidenceInterval({ data }: ETAConfidenceIntervalProps) {
    return (
        <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="max"
                        stroke="none"
                        fill="#3b82f6"
                        fillOpacity={0.1}
                    />
                    <Area
                        type="monotone"
                        dataKey="min"
                        stroke="none"
                        fill="white" // Masking the bottom part
                    />
                    <Area
                        type="monotone"
                        dataKey="expected"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorConfidence)"
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
