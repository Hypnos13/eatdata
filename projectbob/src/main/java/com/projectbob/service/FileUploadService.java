package com.projectbob.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import lombok.extern.slf4j.Slf4j;

import java.io.*;
import java.nio.file.*;
import java.util.*;

@Service
@Slf4j
public class FileUploadService {
	
	@Value("${file.upload-dir}")
	private String uploadBaseDir;
	
	public String uploadFile(MultipartFile file, String subDirectory) 
			throws IOException, IllegalArgumentException {
		
		log.info("FileUploadService: uploadBaseDir = {}", uploadBaseDir);
		log.info("FileUploadService: subDirectory = {}", subDirectory);
		
		if(file.isEmpty()) {
			throw new IllegalArgumentException("업로드 할 파일이 없습니다.");
		}
		
		Path uploadPath = Paths.get(uploadBaseDir, subDirectory);
		
		log.info("FileUploadService: Constructed uploadPath = {}", uploadPath);
		
		if(!Files.exists(uploadPath)) {
			Files.createDirectories(uploadPath);
		}
		
		String originalFileName = file.getOriginalFilename();
		String fileExtension = "";
		if(originalFileName != null && originalFileName.contains(".")) {
			fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
		}
		String savedFilename = UUID.randomUUID().toString()+fileExtension;
		
		Path targetLocation = uploadPath.resolve(savedFilename);
		
		log.info("FileUploadService: Target file location = {}", targetLocation);
		
		Files.copy(file.getInputStream(), targetLocation);
		
		if (subDirectory != null && subDirectory.endsWith("/")) {
            subDirectory = subDirectory.substring(0, subDirectory.length() - 1);
        }
		
		return "/images/" + subDirectory + "/" + savedFilename;
	}
	
	public String getUploadBaseDir() {
		return uploadBaseDir;
	}
	
}
