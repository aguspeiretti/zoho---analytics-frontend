import React, { useState } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import {
  AlertTriangle,
  Download,
  CheckCircle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  BarChart2,
} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// Componente de barra de carga
const LoadingBar = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-200 bg-opacity-50 z-50">
    <div className="flex flex-col items-center">
      <svg
        className="animate-spin h-10 w-10 text-yellow-500 mb-2"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 2.21.895 4.21 2.343 5.657l1.657-1.366z"
        ></path>
      </svg>
      <p className="text-gray-700 font-medium">Cargando datos...</p>
    </div>
  </div>
);

const ZohoDashboard = () => {
  const [exportStatus, setExportStatus] = useState(null);
  const [error, setError] = useState(null);
  const [valueCounts, setValueCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [expandedFields, setExpandedFields] = useState({});

  const countValueOccurrences = (data) => {
    const counts = {};
    data.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (key === "Id") return;
        counts[key] = counts[key] || {};
        counts[key][item[key]] = (counts[key][item[key]] || 0) + 1;
      });
    });
    return counts;
  };

  const exportData = async () => {
    setLoading(true);
    setError(null);
    setExportStatus(null);

    try {
      const url = "http://localhost:4000/api/export-data";
      const response = await axios.get(url);

      if (response.data && Array.isArray(response.data.data)) {
        const valueCounts = countValueOccurrences(response.data.data);
        setValueCounts(valueCounts);
        setExportStatus({ status: "Exportación completada" });
      } else {
        setError({ message: "Formato de datos incorrecto" });
      }
    } catch (err) {
      setError({ message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const generateFieldInsights = (field) => {
    if (!valueCounts[field]) return null;

    const values = valueCounts[field];
    const totalEntries = Object.values(values).reduce(
      (sum, count) => sum + count,
      0
    );

    const sortedValues = Object.entries(values)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count], index) => ({
        label,
        count,
        percentage: ((count / totalEntries) * 100).toFixed(1),
        rank: index + 1,
      }));

    const colorPalette = [
      "#F4C542", // Amarillo
      "#0078D4", // Azul
      "#00B294", // Verde
      "#D83B01", // Naranja
      "#A0A0A0", // Gris
    ];

    return {
      totalEntries,
      allValues: sortedValues,
      topValues: sortedValues.slice(0, 3),
      colorPalette,
    };
  };

  const generateChartData = (field) => {
    if (!valueCounts[field]) return { labels: [], datasets: [] };
    const values = valueCounts[field];
    const sortedValues = Object.entries(values).sort((a, b) => b[1] - a[1]);

    const labels = sortedValues.map(([label]) => label);
    const data = sortedValues.map(([, count]) => count);

    const colorPalette = [
      "rgba(244, 197, 66, 0.7)",
      "rgba(0, 120, 212, 0.7)",
      "rgba(0, 178, 148, 0.7)",
      "rgba(216, 59, 1, 0.7)",
      "rgba(160, 160, 160, 0.7)",
    ];

    return {
      labels,
      datasets: [
        {
          label: field,
          data,
          backgroundColor: labels.map(
            (_, i) => colorPalette[i % colorPalette.length]
          ),
          borderWidth: 1,
        },
      ],
    };
  };

  const toggleFieldExpansion = (field) => {
    setExpandedFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {loading && <LoadingBar />}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Zoho Analytics Dashboard
          </h1>
          <button
            onClick={exportData}
            disabled={loading}
            className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-md shadow hover:bg-yellow-600 transition-colors disabled:opacity-50"
          >
            {loading ? "Exportando..." : "Exportar Datos"}
            <Download className="w-5 h-5" />
          </button>
        </div>

        {exportStatus && (
          <div className="mb-6 flex items-center justify-center text-green-700 bg-green-100 p-3 rounded-md">
            <CheckCircle className="mr-2 w-6 h-6" />
            {exportStatus.status}
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-center justify-center text-red-700 bg-red-100 p-3 rounded-md">
            <AlertTriangle className="mr-2 w-6 h-6" />
            Error: {error.message}
          </div>
        )}

        {Object.keys(valueCounts).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.keys(valueCounts).map((field) => {
              const fieldInsights = generateFieldInsights(field);

              return (
                <div
                  key={field}
                  className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-700">
                      {field}
                    </h2>
                    <BarChart2 className="text-gray-500" />
                  </div>

                  <div className="mb-4 bg-gray-100 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="text-green-600" />
                        <span className="font-medium text-gray-700">
                          Total Entradas
                        </span>
                      </div>
                      <span className="text-lg font-bold text-yellow-500">
                        {fieldInsights.totalEntries}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {fieldInsights.topValues.map((value) => (
                      <div
                        key={value.label}
                        className="flex items-center bg-gray-50 rounded-md p-2"
                      >
                        <div
                          className={`w-10 h-10 bg-yellow-500 rounded-full mr-3 flex items-center justify-center text-white font-bold`}
                        >
                          {value.rank}
                        </div>
                        <div className="flex-grow">
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-800">
                              {value.label}
                            </span>
                            <span className="text-gray-600">
                              {value.count} ({value.percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-300 rounded-full h-2 mt-1">
                            <div
                              className="bg-yellow-500 h-2 rounded-full"
                              style={{ width: `${value.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={() => toggleFieldExpansion(field)}
                      className="w-full flex justify-between items-center bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md transition-colors"
                    >
                      <span>
                        {expandedFields[field] ? "Ocultar" : "Ver"} Todos los
                        Valores
                      </span>
                      {expandedFields[field] ? <ChevronUp /> : <ChevronDown />}
                    </button>

                    {expandedFields[field] && (
                      <div className="mt-2 max-h-64 overflow-y-auto">
                        {fieldInsights.allValues.slice(3).map((value) => (
                          <div
                            key={value.label}
                            className="flex items-center bg-gray-50 rounded-md p-2 mb-1"
                          >
                            <div className="flex-grow flex justify-between">
                              <span>
                                {value.rank}. {value.label}
                              </span>
                              <span className="text-gray-600">
                                {value.count} ({value.percentage}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Gráfico de Barras */}
                  <div className="h-64 mt-6">
                    <Bar
                      data={generateChartData(field)}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "top",
                            labels: { color: "#333" },
                          },
                          tooltip: {
                            backgroundColor: "#fff",
                            titleColor: "#333",
                            bodyColor: "#333",
                            borderColor: "#ccc",
                            borderWidth: 1,
                          },
                        },
                        scales: {
                          x: {
                            ticks: {
                              color: "#333",
                            },
                          },
                          y: {
                            ticks: {
                              color: "#333",
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {Object.keys(valueCounts).length === 0 && loading === false && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-xl">
              Haga clic en "Exportar Datos" para comenzar
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ZohoDashboard;
