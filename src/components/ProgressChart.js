// src/components/ProgressChart.js
import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useTheme } from '../context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

export default function ProgressChart({
  data = [],
  type = 'line', // 'line', 'bar', 'pie', 'donut'
  title = '',
  subtitle = '',
  height = 200,
  width = screenWidth - 32,
  showGrid = true,
  showLabels = true,
  showLegend = false,
  colors = null,
  style = {},
}) {
  const { theme } = useTheme();

  // Default color palette
  const defaultColors = [
    theme.colors.primary,
    theme.colors.success,
    theme.colors.warning,
    theme.colors.error,
    theme.colors.info,
    '#8884d8',
    '#82ca9d',
    '#ffc658',
    '#ff7c7c',
    '#8dd1e1',
  ];

  const chartColors = colors || defaultColors;

  // Common chart configuration
  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(66, 133, 244, ${opacity})`,
    labelColor: (opacity = 1) => theme.colors.textSecondary,
    style: {
      borderRadius: 8,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
    propsForBackgroundLines: {
      stroke: theme.colors.border,
      strokeDasharray: '',
      strokeWidth: 1,
    },
  };

  // Format data for different chart types
  const formatDataForChart = () => {
    if (!data || data.length === 0) return [];

    switch (type) {
      case 'pie':
      case 'donut':
        return data.map((item, index) => ({
          ...item,
          color: chartColors[index % chartColors.length],
          legendFontColor: theme.colors.textSecondary,
          legendFontSize: 12,
        }));
      
      default:
        return data;
    }
  };

  const formattedData = formatDataForChart();

  // Render different chart types
  const renderChart = () => {
    if (!formattedData || formattedData.length === 0) {
      return (
        <View style={{
          height,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.surface,
          borderRadius: 8,
        }}>
          <Text style={{ color: theme.colors.textSecondary }}>
            No data available
          </Text>
        </View>
      );
    }

    switch (type) {
      case 'line':
        return (
          <LineChart
            data={formattedData}
            width={width}
            height={height}
            yAxisLabel=""
            yAxisSuffix=""
            yAxisInterval={1}
            chartConfig={chartConfig}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 8,
            }}
            withHorizontalLabels={showLabels}
            withVerticalLabels={showLabels}
            withDots={true}
            withShadow={false}
            withScrollableDot={false}
            withHorizontalLines={showGrid}
            withVerticalLines={false}
          />
        );

      case 'bar':
        return (
          <BarChart
            data={formattedData}
            width={width}
            height={height}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={chartConfig}
            verticalLabelRotation={30}
            style={{
              marginVertical: 8,
              borderRadius: 8,
            }}
            withHorizontalLabels={showLabels}
            withVerticalLabels={showLabels}
            showValuesOnTopOfBars={true}
            fromZero={true}
          />
        );

      case 'pie':
        return (
          <PieChart
            data={formattedData}
            width={width}
            height={height}
            chartConfig={chartConfig}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="15"
            center={[width / 2 - 15, height / 2]}
            absolute={false}
            style={{
              marginVertical: 8,
              borderRadius: 8,
            }}
            hasLegend={showLegend}
          />
        );

      case 'donut':
        return (
          <View style={{ alignItems: 'center' }}>
            <PieChart
              data={formattedData}
              width={width}
              height={height}
              chartConfig={chartConfig}
              accessor="value"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[width / 2 - 15, height / 2]}
              absolute={false}
              hasLegend={false}
              avoidFalseZero={true}
              style={{
                marginVertical: 8,
                borderRadius: 8,
              }}
            />
            {/* Center content for donut chart */}
            <View style={{
              position: 'absolute',
              top: height / 2 - 20,
              alignItems: 'center',
            }}>
              <Text style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: theme.colors.text,
              }}>
                {formattedData.reduce((sum, item) => sum + (item.value || 0), 0)}
              </Text>
              <Text style={{
                fontSize: 12,
                color: theme.colors.textSecondary,
              }}>
                Total
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  // Custom legend for pie/donut charts
  const renderCustomLegend = () => {
    if (!showLegend || (type !== 'pie' && type !== 'donut')) return null;

    return (
      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: 16,
        paddingHorizontal: 16,
      }}>
        {formattedData.map((item, index) => (
          <View
            key={index}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginHorizontal: 8,
              marginVertical: 4,
            }}
          >
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: item.color,
                marginRight: 6,
              }}
            />
            <Text style={{
              fontSize: 12,
              color: theme.colors.textSecondary,
            }}>
              {item.name} ({item.value})
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[{
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    }, style]}>
      {/* Chart Header */}
      {(title || subtitle) && (
        <View style={{ marginBottom: 16 }}>
          {title && (
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: theme.colors.text,
              marginBottom: 4,
            }}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text style={{
              fontSize: 14,
              color: theme.colors.textSecondary,
            }}>
              {subtitle}
            </Text>
          )}
        </View>
      )}

      {/* Chart Content */}
      <View style={{ alignItems: 'center' }}>
        {renderChart()}
        {renderCustomLegend()}
      </View>

      {/* Data Summary for Line/Bar Charts */}
      {(type === 'line' || type === 'bar') && formattedData.length > 0 && (
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          marginTop: 16,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: theme.colors.divider,
        }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: theme.colors.primary,
            }}>
              {Math.max(...formattedData.map(d => d.value || 0))}
            </Text>
            <Text style={{
              fontSize: 12,
              color: theme.colors.textSecondary,
            }}>
              Peak
            </Text>
          </View>
          
          <View style={{ alignItems: 'center' }}>
            <Text style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: theme.colors.success,
            }}>
              {Math.round(
                formattedData.reduce((sum, d) => sum + (d.value || 0), 0) / formattedData.length
              )}
            </Text>
            <Text style={{
              fontSize: 12,
              color: theme.colors.textSecondary,
            }}>
              Average
            </Text>
          </View>
          
          <View style={{ alignItems: 'center' }}>
            <Text style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: theme.colors.text,
            }}>
              {formattedData.reduce((sum, d) => sum + (d.value || 0), 0)}
            </Text>
            <Text style={{
              fontSize: 12,
              color: theme.colors.textSecondary,
            }}>
              Total
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}