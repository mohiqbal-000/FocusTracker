package com.example.FocusTrackerBackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
@EnableAsync
public class FocusTrackerBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(FocusTrackerBackendApplication.class, args);
	}

}
