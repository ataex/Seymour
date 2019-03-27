#pragma once

#include <vector>
#include <chrono> 
#include <string>

using namespace std;
using namespace std::chrono; 

class Timer {
    static Timer *instance;
    vector<string> names;
    vector<high_resolution_clock::time_point> times;

    // Private constructor so that no objects can be created.
    Timer() {
    }

    public:
    static Timer *getInstance() {
        if (!instance)
            instance = new Timer;
        return instance;
    }

    void addTime(string name) {
        high_resolution_clock::time_point t = high_resolution_clock::now(); 
        this->names.push_back(name);
        this->times.push_back(t);
    }

    void printTimes() {
        cerr << "Printing " << this->names.size() << " Times" <<std::endl;
        for (int i=0; i<(this->names.size()-1); i++) {
            auto duration1 = duration_cast<microseconds>(this->times[i+1] - this->times[i]); 
            cerr << this->names[i+1] << ": " << duration1.count()*0.001 << "ms" << endl; 
        }    
        auto duration1 = duration_cast<microseconds>(this->times.back() - this->times[0]); 
        cerr << "Full Render: " << duration1.count()*0.001 << "ms" << endl; 
    }

    void clearTimes() {
        this->names.clear();
        this->times.clear();
    }
};