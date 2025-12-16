'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
    children: React.ReactNode
    componentName?: string
}

interface ErrorBoundaryState {
    hasError: boolean
    error?: Error
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error(`ErrorBoundary caught an error in ${this.props.componentName || 'component'}:`, error, info)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200 m-4">
                    <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-6 w-6 text-red-600 mt-1" />
                        <div className="space-y-2">
                            <h3 className="font-medium text-red-900">
                                Something went wrong in {this.props.componentName || 'this component'}
                            </h3>
                            <p className="text-sm text-red-700">
                                {this.state.error?.message || 'An unexpected error occurred.'}
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-white text-red-700 border-red-200 hover:bg-red-50"
                                onClick={() => this.setState({ hasError: false, error: undefined })}
                            >
                                Try Again
                            </Button>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
