# Error Boundary System Documentation

## Overview

A comprehensive error boundary system has been implemented to catch and handle errors at multiple levels in the visual editor application. The system provides graceful error handling, error reporting, monitoring, and debugging capabilities.

## Architecture

### Error Boundary Levels

1. **App Level** (`AppErrorBoundary`)
   - Wraps the entire application in `app/layout.tsx`
   - Provides a full-page fallback UI for critical application errors
   - Last line of defense against uncaught errors

2. **Graph Level** (`GraphErrorBoundary`)
   - Wraps React Flow components in `builder-view.tsx`
   - Provides a canvas-specific fallback UI
   - Handles graph rendering and flow-related errors

3. **Node Level** (`NodeErrorBoundary`)
   - Wraps individual node components via HOC
   - Provides placeholder node UI when specific nodes fail
   - Maintains graph functionality when individual nodes error

### Core Components

#### Error Boundary Component (`error-boundary.tsx`)
- Universal error boundary class component
- Configurable fallback UI based on error level
- Integrates with error reporting system
- Provides context-aware error handling

#### Error Reporting System (`error-reporting.ts`)
- Centralized error collection and analysis
- Contextual error information (node ID, type, stack trace)
- Statistics and analytics (error counts by level and time)
- Development console logging and production-ready export

#### Error Monitor (`error-monitor.tsx`)
- Visual debugging interface for development
- Real-time error statistics and history
- Detailed error information with stack traces
- Export functionality for error reports

#### Global Error Monitor (`global-error-monitor.tsx`)
- Keyboard shortcut activation (Ctrl+Shift+E in development)
- Global error monitoring overlay
- Development-only feature

## Implementation Details

### Error Boundary HOC Pattern

```typescript
// Node-level error boundary wrapper
export const withNodeErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> => {
  return (props: P) => (
    <NodeErrorBoundary>
      <Component {...props} />
    </NodeErrorBoundary>
  );
};
```

### Error Context Collection

The system automatically collects:
- Error level (app/graph/node)
- Timestamp and error details
- Node-specific context (ID, type)
- Component stack traces
- Browser and URL information

### Graceful Degradation

1. **Node Errors**: Individual nodes show error placeholder, graph remains functional
2. **Graph Errors**: Canvas shows error message, sidebar and controls remain available
3. **App Errors**: Full fallback UI with option to reload or report issue

## Usage

### Development

- **Error Monitor**: Press `Ctrl+Shift+E` to toggle error monitoring interface
- **Test Components**: Use `ErrorTestComponent` to trigger test errors
- **Console Logging**: Detailed error information logged to browser console

### Production

- **Silent Error Handling**: Errors caught and handled gracefully
- **Error Reporting**: Ready for integration with external monitoring services
- **User Experience**: Fallback UIs maintain application usability

## Integration Points

### Wrapped Components

1. **Application Root**: `app/layout.tsx` → `AppErrorBoundary`
2. **Graph Canvas**: `builder-view.tsx` → `GraphErrorBoundary`
3. **Sidebar Components**: `sidebar.tsx` → Individual section boundaries
4. **Data Menu**: `data-menu.tsx` → Component-level boundaries
5. **All Node Types**: `node-registry.ts` → HOC wrapper for all nodes

### Error Reporting Integration

```typescript
// Manual error reporting
errorReporter.report('node', error, {
  nodeId: 'example-node-id',
  nodeType: 'NumberNode'
});

// Automatic reporting via error boundaries
// (handled internally by ErrorBoundary components)
```

## Configuration

### Environment-Specific Features

- **Development**: Full error monitoring, test components, detailed logging
- **Production**: Silent error handling, export capabilities, user-friendly fallbacks

### Customization Options

- Fallback UI customization per error level
- Error reporting service integration points
- Monitoring dashboard configuration
- Export format and scheduling

## Testing

### Test Components Available

- `ErrorTestComponent`: Trigger errors at different levels
- Integration with error monitor for real-time testing
- Automatic error context collection validation

### Verification

1. Trigger node-level errors → Node shows placeholder, graph continues
2. Trigger graph-level errors → Canvas shows error, controls remain functional
3. Trigger app-level errors → Full fallback UI displayed

## Future Enhancements

### Planned Features

1. **Remote Error Reporting**: Integration with services like Sentry or Bugsnag
2. **Error Recovery**: Automatic retry mechanisms for transient errors
3. **User Feedback**: Error reporting forms for user-submitted issues
4. **Analytics Dashboard**: Comprehensive error analytics and trends
5. **Performance Monitoring**: Error impact on application performance

### Extension Points

- Custom error boundary types for specific components
- Pluggable error reporting backends
- Configurable error handling strategies
- Advanced error recovery mechanisms

## Best Practices

### Error Boundary Usage

1. **Granular Boundaries**: Use appropriate error boundary level for component scope
2. **Context Preservation**: Always provide relevant context for error reporting
3. **Fallback UI**: Design meaningful fallback interfaces for each error level
4. **Testing**: Regularly test error scenarios in development

### Error Handling

1. **Graceful Degradation**: Ensure application remains functional despite errors
2. **User Communication**: Provide clear, actionable error messages
3. **Development Debugging**: Leverage error monitor for debugging complex issues
4. **Production Monitoring**: Set up automated error tracking and alerting

This error boundary system provides a robust foundation for error handling in the visual editor, ensuring a stable user experience while providing comprehensive debugging capabilities for developers.
