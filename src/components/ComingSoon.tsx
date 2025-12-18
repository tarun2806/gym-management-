
import React from 'react';
import { Hammer, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';

interface ComingSoonProps {
    title?: string;
    description?: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({
    title = "Coming Soon",
    description = "We're working hard to bring you this feature. Stay tuned!"
}) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Hammer className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">{title}</h2>
            <p className="text-gray-500 max-w-md mb-8">
                {description}
            </p>
            <div className="flex space-x-4">
                <Button
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="flex items-center"
                >
                    Go Back
                </Button>
                <Button
                    onClick={() => navigate('/')}
                    className="flex items-center"
                >
                    Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

export default ComingSoon;
